import osmnx as ox
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Connect to Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
if not url or not key:
    print("❌ Error: Supabase keys missing in .env")
    exit()

supabase: Client = create_client(url, key)

def upload_chargers_for_city(city_name):
    print(f"⚡ Fetching chargers for {city_name}...")
    
    try:
        # Fetch tags='amenity':'charging_station'
        gdf = ox.features_from_place(city_name, tags={"amenity": "charging_station"})
        
        chargers_to_upload = []
        
        if len(gdf) == 0:
            print(f"   ⚠️ No chargers found in {city_name} (OSM data might be empty here).")
            return

        for index, row in gdf.iterrows():
            # Get Lat/Lon (Handle Points vs Polygons)
            if row.geometry.geom_type == 'Point':
                lat = row.geometry.y
                lon = row.geometry.x
            else:
                lat = row.geometry.centroid.y
                lon = row.geometry.centroid.x

            # Get Name
            name = row.get("name", "Unknown Charger")
            if str(name) == "nan": 
                name = f"EV Station ({row.get('operator', 'Public')})"

            # Guess Power
            power = 50.0 
            
            chargers_to_upload.append({
                "name": str(name)[:100],
                "latitude": float(lat),
                "longitude": float(lon),
                "power_kw": float(power),
                "connector_type": "CCS2",
                "status": "Operational"
            })

        # Batch Insert
        if chargers_to_upload:
            data, count = supabase.table("charging_stations").insert(chargers_to_upload).execute()
            print(f"   ✅ Added {len(chargers_to_upload)} chargers from {city_name}!")
        
    except Exception as e:
        print(f"   ❌ Error fetching {city_name}: {e}")

# Run for Highway Cities (Ahmedabad -> Mumbai)
if __name__ == "__main__":
    cities = [
        "Ahmedabad, Gujarat, India",
        "Vadodara, Gujarat, India",
        "Surat, Gujarat, India",
        "Valsad, Gujarat, India",
        "Vapi, Gujarat, India",
        "Palghar, Maharashtra, India",
        "Virar, Maharashtra, India",
        "Mumbai, Maharashtra, India"
    ]
    
    print("🚀 Starting Highway Seeder...")
    for city in cities:
        upload_chargers_for_city(city)
    
    print("🎉 Database seeding complete!")