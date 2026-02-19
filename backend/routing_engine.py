import requests
import math
import os
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional

@dataclass
class EVSpecs:
    battery_capacity_kwh: float
    range_km: int
    charging_speed_kw: float
    consumption_kwh_per_km: float 

class EVRouter:
    def __init__(self):
        self.ocm_key = os.environ.get("OPEN_CHARGE_MAP_KEY")
        if not self.ocm_key:
            print("⚠️ WARNING: OPEN_CHARGE_MAP_KEY not found in .env")

    def _get_osrm_route(self, waypoints: List[List[float]]):
        """Get route from OSRM"""
        coords_str = ";".join([f"{p[0]},{p[1]}" for p in waypoints])
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200: return None
            data = response.json()
            if not data.get("routes"): return None
            return data["routes"][0]
        except:
            return None

    def _fetch_live_chargers(self, lat, lng, radius_km=50, max_results=10):
        """Fetch real chargers from Open Charge Map API (With better timeout)"""
        if not self.ocm_key: return []
        
        url = "https://api.openchargemap.io/v3/poi"
        
        # 1. Add Headers (Helps avoid getting blocked)
        headers = {
            "User-Agent": "Routelect-EV-Planner/1.0"
        }
        
        params = {
            "key": self.ocm_key,
            "latitude": lat,
            "longitude": lng,
            "distance": radius_km,
            "distanceunit": "KM",
            "maxresults": max_results,
            "compact": True,
            "verbose": False,
            "countrycode": "IN"
        }
        
        try:
            print(f"📡 Scanning for chargers near {lat}, {lng}...")
            
            # 2. INCREASE TIMEOUT to 25 seconds (Free APIs can be slow!)
            res = requests.get(url, params=params, headers=headers, timeout=25)
            
            if res.status_code == 200:
                chargers = []
                data = res.json()
                
                # Check if data is empty
                if not data:
                    print("   ⚠️ No chargers found in this area.")
                    return []

                for poi in data:
                    address_info = poi.get('AddressInfo', {})
                    connections = poi.get('Connections', [])
                    
                    power = 25.0 
                    if connections:
                        try:
                            val = connections[0].get('PowerKW')
                            if val: power = float(val)
                        except: pass
                        
                    chargers.append({
                        "name": address_info.get('Title', 'Public Charger'),
                        "latitude": address_info.get('Latitude'),
                        "longitude": address_info.get('Longitude'),
                        "power_kw": power
                    })
                print(f"   ✅ Found {len(chargers)} live chargers.")
                return chargers
            else:
                print(f"   ❌ OCM API Error: {res.status_code}")
                return []
                
        except requests.exceptions.Timeout:
            print("   ❌ API Timeout: Open Charge Map is too slow right now.")
            return []
        except Exception as e:
            print(f"   ❌ Network Error: {e}")
            return []

    def find_nearest_charger(self, target_lat, target_lng):
        """Finds the best charger using the Live API"""
        chargers = self._fetch_live_chargers(target_lat, target_lng)
        
        if not chargers: return None

        # Sort by distance to the target point
        best_charger = None
        min_dist = float('inf')

        for st in chargers:
            dist = math.sqrt((st["latitude"] - target_lat)**2 + (st["longitude"] - target_lng)**2)
            if dist < min_dist:
                min_dist = dist
                best_charger = st
        
        return best_charger

    def find_route_with_charging(self, start_lat, start_lng, end_lat, end_lng, current_battery_percent, ev_specs, _unused_db_chargers=None):
        try:
            # 1. Direct Route
            direct_route = self._get_osrm_route([[start_lng, start_lat], [end_lng, end_lat]])
            if not direct_route: return {"error": "No route found"}

            total_dist_km = direct_route["distance"] / 1000.0
            
            # 2. Check Range
            current_kwh = (current_battery_percent / 100.0) * ev_specs.battery_capacity_kwh
            max_range_now_km = current_kwh / ev_specs.consumption_kwh_per_km
            
            # If we can make it, return direct
            if max_range_now_km > (total_dist_km + 10):
                raw_coords = direct_route["geometry"]["coordinates"]
                return {
                    "route_coords": [[lat, lon] for lon, lat in raw_coords],
                    "total_distance_km": round(total_dist_km, 2),
                    "estimated_total_time_minutes": round(direct_route["duration"] / 60.0, 0),
                    "needs_charging": False,
                    "charging_stops": [],
                    "message": "Direct trip possible"
                }

            # 3. WE NEED CHARGING: Find the "Critical Point"
            # Instead of the midpoint, let's find where battery hits ~10%
            raw_coords = direct_route["geometry"]["coordinates"]
            
            # Roughly estimate index where we run low (simple percentage of path)
            safe_range_km = max_range_now_km * 0.90 # Plan to stop at 90% of max range
            fraction_traveled = min(0.9, safe_range_km / total_dist_km)
            critical_index = int(len(raw_coords) * fraction_traveled)
            
            critical_point = raw_coords[critical_index] # [lon, lat]
            
            # 4. FETCH LIVE CHARGERS near that point
            best_charger = self.find_nearest_charger(critical_point[1], critical_point[0])
            
            if not best_charger:
                return {"error": "Route too long and no chargers found nearby (OCM)."}

            # 5. Reroute via Charger
            via_charger_route = self._get_osrm_route([
                [start_lng, start_lat], 
                [best_charger["longitude"], best_charger["latitude"]], 
                [end_lng, end_lat]
            ])
            
            if not via_charger_route: return {"error": "Could not calculate route via charger"}

            # Calculate charging time
            new_dist = via_charger_route["distance"] / 1000.0
            new_time = via_charger_route["duration"] / 60.0
            
            charge_needed = (0.80 * ev_specs.battery_capacity_kwh) - (0.10 * ev_specs.battery_capacity_kwh)
            time_to_charge = (charge_needed / best_charger["power_kw"]) * 60

            stops = [{
                "station_name": best_charger["name"],
                "latitude": best_charger["latitude"],
                "longitude": best_charger["longitude"],
                "charge_added_kwh": round(charge_needed, 1),
                "charging_time_minutes": round(time_to_charge, 0)
            }]

            raw_coords = via_charger_route["geometry"]["coordinates"]
            return {
                "route_coords": [[lat, lon] for lon, lat in raw_coords],
                "total_distance_km": round(new_dist, 2),
                "estimated_total_time_minutes": round(new_time + time_to_charge, 0),
                "needs_charging": True,
                "charging_stops": stops,
                "message": "Route calculated via Live OCM Charger"
            }

        except Exception as e:
            print(f"Routing Error: {e}")
            return {"error": str(e)}