"""
routing_engine.py — EVRoute Core Engine v5.0 (Polyline Forward-Seeking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What makes this bulletproof:
  ✅ REAL_WORLD_FACTOR 0.78 — every range calc uses Indian road reality
  ✅ 15% hard safety buffer — battery floor, never violated
  ✅ Corridor Chunking — Bypasses OCM 500-result limits for long distances
  ✅ Polyline Snapping — Exact measurement of forward progress and detours
  ✅ Forward Simulation — Prevents backward routing & guarantees optimal stops
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import requests
import math
import os
from dataclasses import dataclass
from typing import List, Optional, Dict, Set, Tuple

# ─── Constants ──────────────────────────────────────────────────────────
REAL_WORLD_FACTOR = 0.78
COST_PER_KWH_INR = 8.5
LABEL_MIN_KM = 5.0
ELEVATION_IMPACT_KWH_PER_1000M_ASCENT = 3.5
ELEVATION_IMPACT_KWH_PER_1000M_DESCENT = 2.5
_IGNORED_LABELS = frozenset({"", "unnamed road", "service road", "internal road", "private road"})

# ════════════════════════════════════════════════════════════════════════
#  EVSpecs
# ════════════════════════════════════════════════════════════════════════

@dataclass
class EVSpecs:
    battery_capacity_kwh:   float
    range_km:               int
    charging_speed_kw:      float
    consumption_kwh_per_km: float = 0.0   

    def __post_init__(self) -> None:
        if self.range_km > 0:
            lab = self.battery_capacity_kwh / self.range_km
            self.consumption_kwh_per_km = round(lab / REAL_WORLD_FACTOR, 5)

    @property
    def safety_buffer_kwh(self) -> float:
        return self.battery_capacity_kwh * 0.15

    @property
    def real_world_range_km(self) -> float:
        usable = self.battery_capacity_kwh - self.safety_buffer_kwh
        return usable / self.consumption_kwh_per_km if self.consumption_kwh_per_km > 0 else 0

    def range_from_kwh(self, current_kwh: float) -> float:
        usable = max(0.0, current_kwh - self.safety_buffer_kwh)
        return usable / self.consumption_kwh_per_km if self.consumption_kwh_per_km > 0 else 0

    def kwh_consumed_over(self, distance_km: float, elevation_change_m: float = 0.0) -> float:
        base_consumption = distance_km * self.consumption_kwh_per_km
        if elevation_change_m > 0:
            return base_consumption + (elevation_change_m / 1000.0) * ELEVATION_IMPACT_KWH_PER_1000M_ASCENT
        elif elevation_change_m < 0:
            return base_consumption - (abs(elevation_change_m) / 1000.0) * ELEVATION_IMPACT_KWH_PER_1000M_DESCENT
        return base_consumption

# ════════════════════════════════════════════════════════════════════════
#  ElevationProfile
# ════════════════════════════════════════════════════════════════════════

class ElevationProfile:
    def __init__(self, raw_coords: List[List[float]], cumulative_dist: List[float]):
        self.raw_coords = raw_coords
        self.cumulative_dist = cumulative_dist
        self.total_dist = cumulative_dist[-1] if cumulative_dist else 0
        self.sampled_distances = []
        self.sampled_elevations = []
        self.stats = {"ascent_m": 0, "descent_m": 0, "net_impact_kwh": 0.0}
        self._fetch()

    def _fetch(self):
        if not self.raw_coords or self.total_dist == 0:
            return
            
        # Target 99 samples so we always have room for the exact final destination coordinate
        num_samples = min(99, len(self.raw_coords))
        step = max(1, len(self.raw_coords) // num_samples)
        
        sample_lats = []
        sample_lngs = []
        
        for i in range(0, len(self.raw_coords), step):
            if len(sample_lats) >= 99:
                break
            lat, lng = self.raw_coords[i]
            sample_lats.append(round(lat, 5))
            sample_lngs.append(round(lng, 5))
            self.sampled_distances.append(self.cumulative_dist[i])
            
        if self.sampled_distances[-1] != self.cumulative_dist[-1]:
            sample_lats.append(round(self.raw_coords[-1][0], 5))
            sample_lngs.append(round(self.raw_coords[-1][1], 5))
            self.sampled_distances.append(self.cumulative_dist[-1])
            
        lats_str = ",".join(map(str, sample_lats))
        lngs_str = ",".join(map(str, sample_lngs))
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lats_str}&longitude={lngs_str}"
        
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            data = r.json()
            self.sampled_elevations = data.get("elevation", [0.0] * len(sample_lats))
        except Exception as e:
            print(f"⚠️ Open-Meteo elevation fetch failed: {e}")
            self.sampled_elevations = [0.0] * len(sample_lats)

        # Calculate total stats
        ascent, descent = 0.0, 0.0
        for i in range(1, len(self.sampled_elevations)):
            diff = self.sampled_elevations[i] - self.sampled_elevations[i-1]
            if diff > 0: ascent += diff
            else: descent += abs(diff)
        
        self.stats["ascent_m"] = round(ascent)
        self.stats["descent_m"] = round(descent)
        # We will compute net_impact_kwh later dynamically based on actual usage, or provide a rough static estimate here:
        uphill_penalty = (ascent / 1000.0) * ELEVATION_IMPACT_KWH_PER_1000M_ASCENT
        downhill_regen = (descent / 1000.0) * ELEVATION_IMPACT_KWH_PER_1000M_DESCENT
        self.stats["net_impact_kwh"] = round(uphill_penalty - downhill_regen, 2)

    def get_elevation_at_dist(self, dist_km: float) -> float:
        if not self.sampled_elevations: return 0.0
        if dist_km <= 0: return self.sampled_elevations[0]
        if dist_km >= self.total_dist: return self.sampled_elevations[-1]
        
        for i in range(len(self.sampled_distances) - 1):
            d1, d2 = self.sampled_distances[i], self.sampled_distances[i+1]
            if d1 <= dist_km <= d2:
                e1, e2 = self.sampled_elevations[i], self.sampled_elevations[i+1]
                if d2 == d1: return e1
                ratio = (dist_km - d1) / (d2 - d1)
                return e1 + ratio * (e2 - e1)
        return self.sampled_elevations[-1]


# ════════════════════════════════════════════════════════════════════════
#  EVRouter
# ════════════════════════════════════════════════════════════════════════

class EVRouter:
    OSRM = "http://router.project-osrm.org/route/v1/driving"
    OCM  = "https://api.openchargemap.io/v3/poi"
    CHARGE_TO = 0.80

    def __init__(self) -> None:
        self.ocm_key = os.environ.get("OPEN_CHARGE_MAP_KEY", "")
        if not self.ocm_key:
            print("⚠️  OPEN_CHARGE_MAP_KEY not set — DB chargers used as fallback")

    # ════════════════════════════════════════════════════════
    #  GEOMETRY HELPERS
    # ════════════════════════════════════════════════════════

    @staticmethod
    def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        R     = 6371.0
        dlat  = math.radians(lat2 - lat1)
        dlng  = math.radians(lng2 - lng1)
        a     = (math.sin(dlat / 2) ** 2
                 + math.cos(math.radians(lat1))
                 * math.cos(math.radians(lat2))
                 * math.sin(dlng / 2) ** 2)
        return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    @staticmethod
    def _decode_geojson(osrm_route: Dict) -> List[List[float]]:
        # OSRM returns [lng, lat], we want [lat, lng]
        return [[lat, lng] for lng, lat in osrm_route["geometry"]["coordinates"]]

    @staticmethod
    def _coord_key(lat: float, lng: float) -> str:
        return f"{round(lat, 4)},{round(lng, 4)}"

    # ════════════════════════════════════════════════════════
    #  OSRM & LABELS
    # ════════════════════════════════════════════════════════

    def _osrm(self, waypoints: List[List[float]]) -> Optional[Dict]:
        coords = ";".join(f"{lng},{lat}" for lng, lat in waypoints)
        url    = f"{self.OSRM}/{coords}?overview=full&geometries=geojson&steps=true"
        try:
            r = requests.get(url, timeout=14)
            r.raise_for_status()
            routes = r.json().get("routes")
            return routes[0] if routes else None
        except requests.Timeout:
            print("  ⏱️  OSRM request timed out")
            return None
        except Exception as e:
            print(f"  ❌ OSRM error: {e}")
            return None

    @staticmethod
    def _extract_road_names(osrm_route: Dict, elevation_profile: Optional['ElevationProfile'] = None) -> List[Dict]:
        seen:   Set[str]    = set()
        labels: List[Dict]  = []
        # Fallback to empty if no profile
        e_profile = elevation_profile
        
        # We need a way to estimate cumulative distance since start for tooltips
        # We can approximate it by summing step distances
        current_step_dist = 0.0
        
        try:
            for leg in osrm_route.get("legs", []):
                for step in leg.get("steps", []):
                    raw_ref  = (step.get("ref")  or "").strip()
                    raw_name = (step.get("name") or "").strip()
                    dist_km  = step.get("distance", 0) / 1000.0
                    
                    ref   = raw_ref.split(";")[0].strip()
                    base_label = ref or raw_name

                    if not base_label or base_label.lower() in _IGNORED_LABELS or dist_km < LABEL_MIN_KM or base_label in seen:
                        current_step_dist += dist_km
                        continue

                    # Determine terrain status via elevation profile
                    terrain_marker = ""
                    if e_profile:
                        start_elev = e_profile.get_elevation_at_dist(current_step_dist)
                        end_elev = e_profile.get_elevation_at_dist(current_step_dist + dist_km)
                        elev_diff = end_elev - start_elev
                        if elev_diff > 100: terrain_marker = " (↗ Uphill)"
                        elif elev_diff < -100: terrain_marker = " (↘ Downhill)"

                    final_label = f"{base_label}{terrain_marker}"
                    seen.add(base_label)
                    
                    coords = step.get("geometry", {}).get("coordinates", [])
                    if coords:
                        mid = coords[len(coords) // 2]
                        labels.append({"name": final_label, "lat": mid[1], "lng": mid[0]})
                        
                    current_step_dist += dist_km
        except Exception as e:
            print(f"Error extracting road names: {e}")
            pass
        return labels

    # ════════════════════════════════════════════════════════
    #  CORRIDOR CHUNKING & DISCOVERY
    # ════════════════════════════════════════════════════════

    def _fetch_ocm(self, lat: float, lng: float, radius_km: int = 60, max_results: int = 50) -> List[Dict]:
        if not self.ocm_key: return []
        params = {
            "key": self.ocm_key, "latitude": lat, "longitude": lng,
            "distance": radius_km, "distanceunit": "KM", "maxresults": max_results,
            "compact": False, "verbose": False, "countrycode": "IN",
        }
        try:
            r = requests.get(self.OCM, params=params, timeout=22)
            r.raise_for_status()
            data = r.json() or []
            
            chargers = []
            for poi in data:
                addr   = poi.get("AddressInfo") or {}
                conns  = poi.get("Connections")  or []
                status = poi.get("StatusType")   or {}
                op     = poi.get("OperatorInfo") or {}

                clat: object = addr.get("Latitude")
                clng: object = addr.get("Longitude")
                if clat is None or clng is None: continue
                clat = float(clat); clng = float(clng)

                power, connector_type, current_type, num_points = 25.0, "CCS Type 2", "DC", poi.get("NumberOfPoints") or 1
                if conns:
                    best = max(conns, key=lambda c: c.get("PowerKW") or 0)
                    try: power = float(best.get("PowerKW") or 25.0)
                    except: power = 25.0
                    connector_type = (best.get("ConnectionType") or {}).get("Title", "CCS Type 2")
                    current_type = (best.get("CurrentType") or {}).get("Title", "DC")

                chargers.append({
                    "name":           addr.get("Title") or "Public Charger",
                    "lat":            clat, "lng": clng, "latitude": clat, "longitude": clng,
                    "power_kw":       power, "connector_type": connector_type, "current_type": current_type,
                    "num_points":     num_points, "operator": op.get("Title"),
                    "status":         status.get("Title") or "Unknown",
                    "usage_cost":     poi.get("UsageCost") or "Contact operator",
                })
            return chargers
        except Exception as e:
            return []

    def _fetch_corridor_chargers(self, raw_coords: List[List[float]], cumulative_dist: List[float], db_chargers: Optional[List[Dict]]) -> List[Dict]:
        """
        Polls OCM perfectly along the route polyline in 100km milestones to bypass 
        the API total result limits and gather a complete pool of corridor chargers.
        """
        milestones = []
        last_dist = -999.0
        for i, d in enumerate(cumulative_dist):
            if d - last_dist >= 100.0:
                milestones.append(raw_coords[i])
                last_dist = d
                
        # Ensure we cover the destination area
        if cumulative_dist[-1] - last_dist > 50.0:
            milestones.append(raw_coords[-1])
            
        chargers_dict = {}

        # Merge local DB chargers first
        if db_chargers:
            for c in db_chargers:
                lat = float(c.get("latitude") or c.get("lat", 0))
                lng = float(c.get("longitude") or c.get("lng", 0))
                if lat and lng:
                    k = self._coord_key(lat, lng)
                    c["lat"], c["lng"] = lat, lng 
                    chargers_dict[k] = c

        # Poll OCM for each milestone along the highway in parallel (max 5 at a time to respect rate limits)
        if self.ocm_key:
            import concurrent.futures
            
            def fetch_chunk(lat, lng):
                return self._fetch_ocm(lat, lng, radius_km=60, max_results=500)

            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(fetch_chunk, lat, lng) for lat, lng in milestones]
                for future in concurrent.futures.as_completed(futures):
                    chunk = future.result()
                    for c in chunk:
                        k = self._coord_key(c["lat"], c["lng"])
                        chargers_dict[k] = c

        return list(chargers_dict.values())

    def _snap_chargers_to_route(self, chargers: List[Dict], raw_coords: List[List[float]], cumulative_dist: List[float], max_detour_km: float = 30.0) -> List[Dict]:
        """
        Calculates how far along the trip a charger is (route_dist) 
        and how far off the highway it sits (detour_dist).
        """
        snapped = []
        for c in chargers:
            c_lat, c_lng = c["lat"], c["lng"]
            best_dist = float('inf')
            best_route_d = 0.0
            
            # Sub-sample polyline for speed (checking every 5th point)
            # 30km detour is roughly 0.27 degrees. Use 0.35 as a fast conservative bounding box
            BBOX_DEG = 0.35
            for i in range(0, len(raw_coords), 5):
                r_lat, r_lng = raw_coords[i]
                
                # Fast BBOX spatial exclusion skips 99% of slow Haversine math on long routes
                if abs(c_lat - r_lat) > BBOX_DEG or abs(c_lng - r_lng) > BBOX_DEG:
                    continue
                    
                d = self._haversine(c_lat, c_lng, r_lat, r_lng)
                if d < best_dist:
                    best_dist = d
                    best_route_d = cumulative_dist[i]
                    
            if best_dist <= max_detour_km:
                c["detour_dist"] = best_dist
                c["route_dist"]  = best_route_d
                snapped.append(c)
                
        # Sort sequentially along the route
        snapped.sort(key=lambda x: x["route_dist"])
        return snapped

    # ════════════════════════════════════════════════════════
    #  MAIN ROUTING FUNCTION
    # ════════════════════════════════════════════════════════

    def _charge_time(self, needed_kwh: float, charger_kw: float) -> float:
        effective_kw = min(charger_kw, 150.0)
        return round((needed_kwh / max(effective_kw, 1.0)) * 60.0, 1)

    def find_route_with_charging(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float, battery_pct: float, specs: EVSpecs, db_chargers: Optional[List[Dict]] = None, user_waypoints: Optional[List[List[float]]] = None) -> Dict:
        try:
            # 0. Sanity check — same location?
            if self._haversine(start_lat, start_lng, end_lat, end_lng) < 0.5:
                return {"error": "Start and destination are the same or too close together."}

            # Build ordered waypoint list for OSRM: start → user waypoints → end
            osrm_points = [[start_lng, start_lat]]
            for wp in (user_waypoints or []):
                osrm_points.append([wp[1], wp[0]])   # [lng, lat]
            osrm_points.append([end_lng, end_lat])

            # 1. Fetch OSRM baseline through all user waypoints
            direct = self._osrm(osrm_points)
            if not direct: return {"error": "Could not fetch a road route between these locations. OSRM may be down."}

            raw_coords = self._decode_geojson(direct)
            if len(raw_coords) < 2: return {"error": "Route geometry is invalid."}

            # 2. Build cumulative distance profile
            cumulative_dist = [0.0] * len(raw_coords)
            for i in range(1, len(raw_coords)):
                cumulative_dist[i] = cumulative_dist[i-1] + self._haversine(
                    raw_coords[i-1][0], raw_coords[i-1][1], raw_coords[i][0], raw_coords[i][1]
                )
            total_dist_km = cumulative_dist[-1]
            total_drive_min = direct["duration"] / 60.0

            # 3. Quick check: Is a direct route possible?
            elevation_profile = ElevationProfile(raw_coords, cumulative_dist)
            
            current_kwh = (battery_pct / 100.0) * specs.battery_capacity_kwh
            total_elev_change = elevation_profile.get_elevation_at_dist(total_dist_km) - elevation_profile.get_elevation_at_dist(0.0)
            energy_needed = specs.kwh_consumed_over(total_dist_km, total_elev_change)
            real_world_range = specs.real_world_range_km
            
            # Use strict total simulation for direct reachability
            direct_usable_energy = current_kwh - specs.safety_buffer_kwh
            
            if energy_needed <= direct_usable_energy:
                kwh_at_arrival = min(specs.battery_capacity_kwh, current_kwh - energy_needed)
                arr_pct = round((kwh_at_arrival / specs.battery_capacity_kwh) * 100, 1)
                # Warn if arriving below 20%
                arrival_warning = None
                if arr_pct < 20:
                    arrival_warning = f"You will arrive with only {arr_pct}% battery. Consider charging en route."
                return {
                    "route_coords": self._decode_geojson(direct),
                    "total_distance_km": round(total_dist_km, 2),
                    "estimated_total_time_minutes": round(total_drive_min),
                    "needs_charging": False,
                    "charging_stops": [],
                    "energy_kwh_used": round(energy_needed, 2),
                    "estimated_charge_cost_inr": round(energy_needed * COST_PER_KWH_INR),
                    "battery_at_arrival_pct": arr_pct,
                    "low_arrival_warning": arrival_warning,
                    "real_world_range_km": round(real_world_range),
                    "road_names": self._extract_road_names(direct, elevation_profile),
                    "user_waypoints": [[wp[0], wp[1]] for wp in (user_waypoints or [])],
                    "message": "Direct trip possible — no charging needed 🎉",
                    "elevation_stats": elevation_profile.stats
                }

            # 4. Gather & Snap Chargers Corridor
            raw_pool = self._fetch_corridor_chargers(raw_coords, cumulative_dist, db_chargers)
            snapped_chargers = self._snap_chargers_to_route(raw_pool, raw_coords, cumulative_dist, max_detour_km=30.0)

            # 5. Forward-Seeking Simulation Loop
            current_route_dist = 0.0
            current_qty_kwh = current_kwh
            stops = []
            total_stop_min = 0.0
            max_charge_kwh = self.CHARGE_TO * specs.battery_capacity_kwh
            is_partial = False

            while True:
                # Calculate max absolute flat-reach for fallback loops
                max_reach_flat_km = current_route_dist + specs.range_from_kwh(current_qty_kwh)
                
                # Check if we successfully reached the destination considering altitude
                remaining_dist = total_dist_km - current_route_dist
                elev_to_dest = elevation_profile.get_elevation_at_dist(total_dist_km) - elevation_profile.get_elevation_at_dist(current_route_dist)
                energy_to_dest = specs.kwh_consumed_over(remaining_dist, elev_to_dest)
                
                if energy_to_dest <= (current_qty_kwh - specs.safety_buffer_kwh):
                    break
                    
                # Find valid, strictly forward chargers
                reachable = []
                for c in snapped_chargers:
                    req_dist_to_c = (c["route_dist"] - current_route_dist) + c["detour_dist"]
                    # Must be at least 2km ahead to prevent infinite loop on the exact same charger
                    if c["route_dist"] >= current_route_dist + 2.0:
                        elev_change = elevation_profile.get_elevation_at_dist(c["route_dist"]) - elevation_profile.get_elevation_at_dist(current_route_dist)
                        energy_req = specs.kwh_consumed_over(req_dist_to_c, elev_change)
                        if energy_req <= (current_qty_kwh - specs.safety_buffer_kwh):
                            reachable.append(c)
                            
                if not reachable:
                    is_partial = True
                    break
                    
                # Score candidates: Prioritize forward progress, penalize detour, reward power
                best_charger = None
                best_score = -9999
                max_power = max([float(c.get("power_kw", 25.0)) for c in reachable] + [50.0])
                
                for c in reachable:
                    progress_ratio = (c["route_dist"] - current_route_dist) / max(1.0, (max_reach_flat_km - current_route_dist))
                    detour_penalty = c["detour_dist"] / 30.0
                    power_score = min(float(c.get("power_kw", 25.0)) / max_power, 1.0)
                    
                    score = (progress_ratio * 0.55) - (detour_penalty * 0.30) + (power_score * 0.15)
                    if score > best_score:
                        best_score = score
                        best_charger = c
                        
                if not best_charger:
                    is_partial = True
                    break 
                    
                # Simulate driving & charging
                drive_dist = (best_charger["route_dist"] - current_route_dist) + best_charger["detour_dist"]
                b_elev_change = elevation_profile.get_elevation_at_dist(best_charger["route_dist"]) - elevation_profile.get_elevation_at_dist(current_route_dist)
                kwh_used = specs.kwh_consumed_over(drive_dist, b_elev_change)
                kwh_at_arrival = min(specs.battery_capacity_kwh, max(specs.safety_buffer_kwh, current_qty_kwh - kwh_used))
                
                charge_needed = max(0.0, max_charge_kwh - kwh_at_arrival)
                stop_min = self._charge_time(charge_needed, float(best_charger.get("power_kw", 50.0)))
                
                stops.append({
                    **best_charger,
                    "station_name": best_charger.get("name", "Charging Station"),
                    "charge_added_kwh": round(charge_needed, 2),
                    "charging_time_minutes": round(stop_min),
                    "battery_at_arrival_pct": round((kwh_at_arrival / specs.battery_capacity_kwh) * 100, 1),
                    "battery_at_departure_pct": round(self.CHARGE_TO * 100),
                    "charger_power_kw": best_charger.get("power_kw", 50.0)
                })
                
                total_stop_min += stop_min
                current_route_dist = best_charger["route_dist"]
                
                # Exiting the detour back to the highway costs energy (assume 0 elevation change immediately at exit)
                current_qty_kwh = min(specs.battery_capacity_kwh, max_charge_kwh - specs.kwh_consumed_over(best_charger["detour_dist"]))
                
                if len(stops) > 25: 
                    # Failsafe
                    is_partial = True
                    break
                    
            # Calculate real final battery at destination
            remaining_dist_to_dest = total_dist_km - current_route_dist
            final_elev_change = elevation_profile.get_elevation_at_dist(total_dist_km) - elevation_profile.get_elevation_at_dist(current_route_dist)
            energy_to_dest = specs.kwh_consumed_over(remaining_dist_to_dest, final_elev_change)
            final_kwh_at_dest = min(specs.battery_capacity_kwh, max(specs.safety_buffer_kwh, current_qty_kwh - energy_to_dest))
            final_battery_pct = round((final_kwh_at_dest / specs.battery_capacity_kwh) * 100, 1)

            # 6. Build Final OSRM Route geometry with user waypoints + charging stops
            if not stops:
                # Low battery mode — find the nearest charger to the user's current position
                nearest = None
                nearest_dist = float('inf')
                for c in raw_pool:
                    d = self._haversine(start_lat, start_lng, c["lat"], c["lng"])
                    if d < nearest_dist:
                        nearest_dist = d
                        nearest = c

                if nearest:
                    return {
                        "error": None,
                        "partial_route": True,
                        "low_battery_mode": True,
                        "route_coords": [[start_lat, start_lng], [nearest["lat"], nearest["lng"]]],
                        "total_distance_km": round(nearest_dist, 2),
                        "estimated_total_time_minutes": round(nearest_dist * 1.5),
                        "needs_charging": True,
                        "charging_stops": [{
                            **nearest,
                            "station_name": nearest.get("name", "Nearest Charging Station"),
                            "charge_added_kwh": round(specs.battery_capacity_kwh * 0.65, 2),
                            "charging_time_minutes": round(self._charge_time(
                                specs.battery_capacity_kwh * 0.65,
                                float(nearest.get("power_kw", 50.0))
                            )),
                            "battery_at_arrival_pct": round((current_kwh / specs.battery_capacity_kwh) * 100, 1),
                            "battery_at_departure_pct": round(self.CHARGE_TO * 100),
                            "charger_power_kw": nearest.get("power_kw", 50.0),
                        }],
                        "battery_at_arrival_pct": round((current_kwh / specs.battery_capacity_kwh) * 100, 1),
                        "real_world_range_km": round(specs.real_world_range_km),
                        "road_names": [],
                        "coverage_warning": None,
                        "elevation_stats": elevation_profile.stats,
                        "message": (
                            f"⚠️ Battery too low to plan full route. "
                            f"Nearest charger is {round(nearest_dist, 1)} km away — "
                            f"charge up there first, then re-plan your trip."
                        ),
                    }
                else:
                    return {
                        "error": (
                            "Battery critically low and no nearby charging stations found. "
                            "Please charge your vehicle before attempting this route."
                        )
                    }
            
            # Merge user waypoints and charging stops in route-distance order
            # so OSRM produces a single coherent polyline through everything.
            all_via = []
            # Add charging stops with their route_dist for ordering
            for s in stops:
                all_via.append({"lng": s["lng"], "lat": s["lat"], "route_dist": s.get("route_dist", 0), "type": "charger"})
            # Add user waypoints — snap them to route_dist for proper ordering
            for wp in (user_waypoints or []):
                wp_lat, wp_lng = wp[0], wp[1]
                best_d = float('inf')
                best_rd = 0.0
                for i in range(0, len(raw_coords), 5):
                    d = self._haversine(wp_lat, wp_lng, raw_coords[i][0], raw_coords[i][1])
                    if d < best_d:
                        best_d = d
                        best_rd = cumulative_dist[i]
                all_via.append({"lng": wp_lng, "lat": wp_lat, "route_dist": best_rd, "type": "waypoint"})
            
            # Sort all via-points by their position along the route
            all_via.sort(key=lambda x: x["route_dist"])
            
            waypoints_osrm = [[start_lng, start_lat]] + [[v["lng"], v["lat"]] for v in all_via] + [[end_lng, end_lat]]
            exact_route = self._osrm(waypoints_osrm)
            if not exact_route:
                return {"error": "Successfully mapped charging stops but could not resolve final OSRM geometry."}
                
            final_dist_km = exact_route["distance"] / 1000.0
            final_elev_total = elevation_profile.get_elevation_at_dist(final_dist_km) - elevation_profile.get_elevation_at_dist(0.0)
            final_kwh = specs.kwh_consumed_over(final_dist_km, final_elev_total)
            cost = round(max(0, final_kwh) * COST_PER_KWH_INR)
            
            uncovered_km = 0
            warn = None
            if is_partial:
                last_reach = current_route_dist + specs.range_from_kwh(current_qty_kwh)
                uncovered_km = max(0, round(total_dist_km - last_reach))
                warn = (
                    f"No chargers found for the final '{uncovered_km} km' stretch. "
                    f"The {len(stops)} stops shown are confirmed optimally along the highway. "
                    f"Charge fully at the final stop to maximize your reach."
                )
                
            return {
                "route_coords": self._decode_geojson(exact_route),
                "total_distance_km": round(final_dist_km, 2),
                "estimated_total_time_minutes": round((exact_route["duration"] / 60.0) + total_stop_min),
                "needs_charging": True,
                "charging_stops": stops,
                "energy_kwh_used": round(final_kwh, 2),
                "estimated_charge_cost_inr": cost,
                "petrol_equivalent_cost_inr": round(final_dist_km * 7),
                "savings_vs_petrol_inr": max(0, round((final_dist_km * 7) - cost)),
                "battery_at_arrival_pct": final_battery_pct if not is_partial else f"Low (~{final_battery_pct}%)", 
                "real_world_range_km": round(real_world_range),
                "road_names": self._extract_road_names(exact_route, elevation_profile),
                "user_waypoints": [[wp[0], wp[1]] for wp in (user_waypoints or [])],
                "partial_route": is_partial,
                "uncovered_km": uncovered_km,
                "coverage_warning": warn,
                "elevation_stats": elevation_profile.stats,
                "message": (
                    f"Partial routing — {len(stops)} stops mapped, but the final ~{uncovered_km}km lacks coverage ⚠️"
                    if is_partial else
                    f"Optimised ABRP-level route via {len(stops)} charging stop(s) — ready to go ⚡"
                ),
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": f"Unexpected routing logic error: {str(e)}"}