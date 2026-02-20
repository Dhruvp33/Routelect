"""
routing_engine.py  — EV Route Planner Core Engine
Improvements over v1:
  - Model-accurate consumption (calculated from DB specs, not hardcoded 0.15)
  - 10 % safety buffer (never route below critical charge)
  - Multi-stop charging (handles very long routes)
  - Returns energy_kwh & cost data so the frontend Trip Summary is accurate
  - Better fallback when OCM is slow / offline
"""

import requests
import math
import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict

# ─── Data Classes ───────────────────────────────────────────

@dataclass
class EVSpecs:
    battery_capacity_kwh:  float
    range_km:              int
    charging_speed_kw:     float
    consumption_kwh_per_km: float = 0.0  # auto-calculated if 0

    def __post_init__(self):
        # Always derive consumption from real specs (ignore any hardcoded value)
        if self.range_km > 0:
            self.consumption_kwh_per_km = round(
                self.battery_capacity_kwh / self.range_km, 4
            )

    @property
    def usable_kwh(self) -> float:
        """95 % of capacity is realistically usable"""
        return self.battery_capacity_kwh * 0.95

    @property
    def safety_buffer_kwh(self) -> float:
        """Keep 10 % charge as a non-negotiable safety reserve"""
        return self.battery_capacity_kwh * 0.10

    def effective_range_km(self, current_kwh: float) -> float:
        """How far we can go from current_kwh, respecting safety buffer"""
        usable = max(0.0, current_kwh - self.safety_buffer_kwh)
        return usable / self.consumption_kwh_per_km

# ─── Router ─────────────────────────────────────────────────

class EVRouter:
    OSRM_URL      = "http://router.project-osrm.org/route/v1/driving"
    OCM_URL       = "https://api.openchargemap.io/v3/poi"
    CHARGE_TO_PCT = 0.80   # charge up to 80 % at each stop (fast-charge sweet spot)

    def __init__(self):
        self.ocm_key = os.environ.get("OPEN_CHARGE_MAP_KEY", "")
        if not self.ocm_key:
            print("⚠️  OPEN_CHARGE_MAP_KEY not set — will use DB chargers only")

    # ── OSRM ────────────────────────────────────────────────

    def _osrm_route(self, waypoints: List[List[float]]) -> Optional[Dict]:
        """
        waypoints: list of [lng, lat]
        Returns the first OSRM route dict, or None.
        """
        coords_str = ";".join(f"{lng},{lat}" for lng, lat in waypoints)
        url = f"{self.OSRM_URL}/{coords_str}?overview=full&geometries=geojson"
        try:
            r = requests.get(url, timeout=12)
            r.raise_for_status()
            routes = r.json().get("routes")
            return routes[0] if routes else None
        except Exception as e:
            print(f"  OSRM error: {e}")
            return None

    # ── Open Charge Map ─────────────────────────────────────

    def _fetch_ocm_chargers(self, lat: float, lng: float,
                             radius_km: int = 60,
                             max_results: int = 15) -> List[Dict]:
        if not self.ocm_key:
            return []
        params = {
            "key":          self.ocm_key,
            "latitude":     lat,
            "longitude":    lng,
            "distance":     radius_km,
            "distanceunit": "KM",
            "maxresults":   max_results,
            "compact":      True,
            "verbose":      False,
            "countrycode":  "IN",
        }
        headers = {"User-Agent": "EVRoute-Planner/2.0"}
        try:
            print(f"  🔌 Scanning OCM near ({lat:.4f}, {lng:.4f})…")
            r = requests.get(self.OCM_URL, params=params, headers=headers, timeout=20)
            r.raise_for_status()
            data = r.json()
            chargers = []
            for poi in data:
                addr  = poi.get("AddressInfo", {})
                conns = poi.get("Connections", [])
                power = 25.0
                if conns:
                    try:
                        power = float(conns[0].get("PowerKW") or 25.0)
                    except (TypeError, ValueError):
                        pass
                clat = addr.get("Latitude")
                clng = addr.get("Longitude")
                if clat is None or clng is None:
                    continue
                chargers.append({
                    "name":      addr.get("Title", "Public Charger"),
                    "latitude":  float(clat),
                    "longitude": float(clng),
                    "power_kw":  power,
                    "lat":       float(clat),   # alias for convenience
                    "lng":       float(clng),
                })
            print(f"  ✅ {len(chargers)} OCM chargers found")
            return chargers
        except requests.Timeout:
            print("  ⏱️  OCM timeout — using DB fallback")
            return []
        except Exception as e:
            print(f"  ❌ OCM error: {e}")
            return []

    def _nearest_charger(self, lat: float, lng: float,
                          db_chargers: Optional[List[Dict]] = None) -> Optional[Dict]:
        """
        Returns the closest charger to (lat, lng).
        Tries OCM first; falls back to db_chargers if supplied.
        """
        candidates = self._fetch_ocm_chargers(lat, lng)
        if not candidates and db_chargers:
            candidates = db_chargers

        if not candidates:
            return None

        best, best_dist = None, float("inf")
        for c in candidates:
            clat = c.get("latitude") or c.get("lat")
            clng = c.get("longitude") or c.get("lng")
            if clat is None or clng is None:
                continue
            dist = math.hypot(clat - lat, clng - lng)
            if dist < best_dist:
                best_dist = dist
                best = c
        return best

    # ── Helpers ─────────────────────────────────────────────

    @staticmethod
    def _haversine_km(lat1, lng1, lat2, lng2) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat / 2) ** 2
             + math.cos(math.radians(lat1))
             * math.cos(math.radians(lat2))
             * math.sin(dlng / 2) ** 2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    @staticmethod
    def _route_coords(osrm_route: Dict) -> List[List[float]]:
        """Convert OSRM GeoJSON coords [lng,lat] → [[lat,lng], …]"""
        return [[lat, lng]
                for lng, lat in osrm_route["geometry"]["coordinates"]]

    def _charging_time_minutes(self, charge_needed_kwh: float,
                                charger_power_kw: float) -> float:
        """Minutes to add charge_needed_kwh at charger_power_kw"""
        effective_power = min(charger_power_kw, 150.0)  # real-world cap
        return round((charge_needed_kwh / effective_power) * 60.0, 1)

    # ── Main Entry Point ────────────────────────────────────

    def find_route_with_charging(
        self,
        start_lat: float, start_lng: float,
        end_lat:   float, end_lng:   float,
        current_battery_pct: float,
        ev_specs:  EVSpecs,
        db_chargers: Optional[List[Dict]] = None,
    ) -> Dict:
        """
        Returns a route dict:
          route_coords, total_distance_km, estimated_total_time_minutes,
          needs_charging, charging_stops,
          energy_kwh_used, estimated_charge_cost_inr, message
        """
        try:
            # ── 1. Get the direct route ──────────────────────
            direct = self._osrm_route([[start_lng, start_lat],
                                        [end_lng,   end_lat]])
            if not direct:
                return {"error": "No route found between these locations. Try different points."}

            total_dist_km  = direct["distance"] / 1000.0
            total_drive_min = direct["duration"] / 60.0
            raw_coords      = direct["geometry"]["coordinates"]

            # ── 2. Battery maths ─────────────────────────────
            current_kwh      = (current_battery_pct / 100.0) * ev_specs.battery_capacity_kwh
            energy_needed    = total_dist_km * ev_specs.consumption_kwh_per_km
            effective_range  = ev_specs.effective_range_km(current_kwh)

            # Cost metadata (always returned)
            cost_per_kwh_inr = 8.5
            charge_cost_inr  = round(energy_needed * cost_per_kwh_inr, 0)

            # ── 3. Direct trip? ───────────────────────────────
            if effective_range >= total_dist_km:
                return {
                    "route_coords":                  self._route_coords(direct),
                    "total_distance_km":             round(total_dist_km, 2),
                    "estimated_total_time_minutes":  round(total_drive_min),
                    "needs_charging":                False,
                    "charging_stops":                [],
                    "energy_kwh_used":               round(energy_needed, 2),
                    "estimated_charge_cost_inr":     charge_cost_inr,
                    "battery_at_arrival_pct":        round(
                        ((current_kwh - energy_needed) / ev_specs.battery_capacity_kwh) * 100, 1
                    ),
                    "message": "Direct trip possible — no charging stop needed",
                }

            # ── 4. Need charging: find stop(s) ───────────────
            # Walk the route geometry and find where battery hits the safety buffer
            remaining_kwh  = current_kwh
            stops          = []
            total_stop_min = 0.0
            current_pos    = [start_lng, start_lat]
            segment_start  = 0

            for _ in range(5):  # max 5 charging stops
                # Find the point where we'd hit the safety buffer
                consumed_so_far  = 0.0
                critical_index   = len(raw_coords) - 1
                prev_lng, prev_lat = current_pos

                for i in range(segment_start + 1, len(raw_coords)):
                    p_lng, p_lat = raw_coords[i]
                    seg_km = self._haversine_km(prev_lat, prev_lng, p_lat, p_lng)
                    consumed_so_far += seg_km * ev_specs.consumption_kwh_per_km
                    if remaining_kwh - consumed_so_far <= ev_specs.safety_buffer_kwh + 1.0:
                        # Back off a few points so we still have juice to reach charger
                        critical_index = max(segment_start, i - max(1, int(len(raw_coords) * 0.04)))
                        break
                    prev_lng, prev_lat = p_lng, p_lat

                crit_lng, crit_lat = raw_coords[critical_index]

                # Find nearest charger to that critical point
                charger = self._nearest_charger(crit_lat, crit_lng, db_chargers)
                if not charger:
                    return {
                        "error": (
                            "Route requires charging but no stations were found nearby. "
                            "Please check your OPEN_CHARGE_MAP_KEY or reduce trip distance."
                        )
                    }

                c_lat = charger.get("latitude") or charger.get("lat")
                c_lng = charger.get("longitude") or charger.get("lng")

                # How much energy did we use to reach this charger?
                dist_to_charger = self._haversine_km(
                    current_pos[1], current_pos[0], c_lat, c_lng
                )
                kwh_to_charger = dist_to_charger * ev_specs.consumption_kwh_per_km
                kwh_at_charger = max(
                    ev_specs.safety_buffer_kwh,
                    remaining_kwh - kwh_to_charger
                )

                # Charge up to 80 % (fast-charge sweet spot, avoids taper)
                target_kwh    = self.CHARGE_TO_PCT * ev_specs.battery_capacity_kwh
                charge_needed = max(0.0, target_kwh - kwh_at_charger)
                stop_minutes  = self._charging_time_minutes(
                    charge_needed, charger.get("power_kw", 50.0)
                )

                stops.append({
                    "station_name":          charger.get("name", "Charging Station"),
                    "lat":                   c_lat,
                    "lng":                   c_lng,
                    "latitude":              c_lat,
                    "longitude":             c_lng,
                    "charge_added_kwh":      round(charge_needed, 2),
                    "charging_time_minutes": stop_minutes,
                    "charger_power_kw":      charger.get("power_kw", 50.0),
                })

                total_stop_min += stop_minutes
                remaining_kwh   = target_kwh

                # Check: can we reach destination from here?
                dist_charger_to_end = self._haversine_km(c_lat, c_lng, end_lat, end_lng)
                if ev_specs.effective_range_km(remaining_kwh) >= dist_charger_to_end:
                    break   # we're good — no more stops needed

                # Otherwise continue from charger position
                current_pos    = [c_lng, c_lat]
                segment_start  = critical_index

            # ── 5. Build the via-charger OSRM route ──────────
            waypoints = [[start_lng, start_lat]]
            for s in stops:
                waypoints.append([s["lng"], s["lat"]])
            waypoints.append([end_lng, end_lat])

            via_route = self._osrm_route(waypoints)
            if not via_route:
                return {"error": "Could not calculate route via charging stop(s)."}

            final_dist_km  = via_route["distance"] / 1000.0
            final_drive_min = via_route["duration"] / 60.0
            final_energy   = final_dist_km * ev_specs.consumption_kwh_per_km

            return {
                "route_coords":                 self._route_coords(via_route),
                "total_distance_km":            round(final_dist_km, 2),
                "estimated_total_time_minutes": round(final_drive_min + total_stop_min),
                "needs_charging":               True,
                "charging_stops":               stops,
                "energy_kwh_used":              round(final_energy, 2),
                "estimated_charge_cost_inr":    round(final_energy * cost_per_kwh_inr, 0),
                "battery_at_arrival_pct":       10.0,  # arrives near buffer
                "message": f"Route via {len(stops)} charging stop(s)",
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": f"Routing engine error: {str(e)}"}