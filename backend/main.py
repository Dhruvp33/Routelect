"""
main.py — EVRoute API v3.0 (FastAPI + Supabase)
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os, math
from dotenv import load_dotenv
from routing_engine import EVRouter, EVSpecs

load_dotenv()

app = FastAPI(title="EVRoute API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "https://routelect.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("❌ SUPABASE_URL and SUPABASE_KEY required in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 EVRoute Engine v3.0 starting…")
router_engine = EVRouter()


class RouteRequest(BaseModel):
    start_lat:               float
    start_lng:               float
    end_lat:                 float
    end_lng:                 float
    current_battery_percent: float
    car_model_id:            int


@app.get("/")
def health():
    return {"status": "healthy", "version": "3.0.0"}


@app.get("/api/brands")
def get_brands():
    return supabase.table("car_brands").select("*").order("name").execute().data


@app.get("/api/brands/{brand_id}/models")
def get_models(brand_id: int):
    brand = supabase.table("car_brands").select("*").eq("id", brand_id).execute().data
    if not brand:
        raise HTTPException(404, "Brand not found")
    brand = brand[0]

    models = (
        supabase.table("car_models")
        .select("*")
        .eq("brand_id", brand_id)
        .order("range_km", desc=True)
        .execute().data
    )
    return [
        {
            **m,
            "brand":      brand["name"],
            "brand_logo": brand.get("logo_url"),
            "consumption_wh_per_km": round(
                (float(m["battery_capacity_kwh"]) / int(m["range_km"])) * 1000, 1
            ),
        }
        for m in models
    ]


@app.get("/api/chargers/nearby")
def nearby_chargers(
    lat:       float = Query(...),
    lng:       float = Query(...),
    radius_km: int   = Query(50),
    limit:     int   = Query(20),
):
    deg = radius_km / 111.0
    data = (
        supabase.table("charging_stations")
        .select("*")
        .gte("latitude",  lat - deg).lte("latitude",  lat + deg)
        .gte("longitude", lng - deg).lte("longitude", lng + deg)
        .eq("available", True)
        .order("power_kw", desc=True)
        .limit(limit)
        .execute()
    )
    return {"count": len(data.data), "stations": data.data}


@app.post("/api/route/calculate")
def calculate_route(req: RouteRequest):
    if not (5 <= req.current_battery_percent <= 100):
        raise HTTPException(400, "Battery percent must be 5–100")

    car_res = (
        supabase.table("car_models")
        .select("*, car_brands(name)")
        .eq("id", req.car_model_id)
        .execute()
    )
    if not car_res.data:
        raise HTTPException(404, f"Car model {req.car_model_id} not found")
    car = car_res.data[0]

    # EVSpecs auto-derives real-world consumption from battery/range
    specs = EVSpecs(
        battery_capacity_kwh = float(car["battery_capacity_kwh"]),
        range_km             = int(car["range_km"]),
        charging_speed_kw    = float(car.get("charging_speed_kw") or 50.0),
    )

    brand_name = car["car_brands"]["name"] if car.get("car_brands") else "Unknown"
    print(
        f"🗺️  {brand_name} {car['name']} | "
        f"{req.current_battery_percent}% battery | "
        f"consumption {specs.consumption_kwh_per_km:.4f} kWh/km | "
        f"real-world range {specs.real_world_range_km:.0f} km"
    )

    # Fetch DB chargers along the corridor as OCM fallback
    lat_mid   = (req.start_lat + req.end_lat) / 2
    lng_mid   = (req.start_lng + req.end_lng) / 2
    trip_km   = math.hypot(req.end_lat - req.start_lat, req.end_lng - req.start_lng) * 111
    deg_r     = (trip_km / 2 + 80) / 111.0

    db_chargers = (
        supabase.table("charging_stations")
        .select("name, latitude, longitude, power_kw, charger_type, operator")
        .gte("latitude",  lat_mid - deg_r).lte("latitude",  lat_mid + deg_r)
        .gte("longitude", lng_mid - deg_r).lte("longitude", lng_mid + deg_r)
        .eq("available", True)
        .execute()
    ).data or []

    result = router_engine.find_route_with_charging(
        req.start_lat, req.start_lng,
        req.end_lat,   req.end_lng,
        req.current_battery_percent,
        specs,
        db_chargers,
    )

    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)