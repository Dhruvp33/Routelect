"""
main.py  — EV Route Planner API (FastAPI + Supabase)
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os
from dotenv import load_dotenv

from routing_engine import EVRouter, EVSpecs

load_dotenv()

# ─── App Setup ──────────────────────────────────────────────

app = FastAPI(
    title="EVRoute API",
    description="Intelligent EV Route Planner for Indian Roads",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",   # Vite preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Supabase ────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "❌ SUPABASE_URL and SUPABASE_KEY must be set in your .env file"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Routing Engine ──────────────────────────────────────────

print("🚀 Initialising EVRoute Engine v2.0…")
router_engine = EVRouter()

# ─── Request Models ──────────────────────────────────────────

class RouteRequest(BaseModel):
    start_lat:               float
    start_lng:               float
    end_lat:                 float
    end_lng:                 float
    current_battery_percent: float
    car_model_id:            int

# ─── Root / Health ───────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    return {
        "status":  "healthy",
        "version": "2.0.0",
        "message": "EVRoute API is running",
    }

# ─── Brands ──────────────────────────────────────────────────

@app.get("/api/brands", tags=["Vehicles"])
def get_brands():
    try:
        result = supabase.table("car_brands").select("*").order("name").execute()
        return result.data
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

# ─── Models (with brand name injected) ───────────────────────

@app.get("/api/brands/{brand_id}/models", tags=["Vehicles"])
def get_models(brand_id: int):
    try:
        # Fetch brand info so the frontend can show it in breadcrumb / model cards
        brand_res = supabase.table("car_brands").select("*").eq("id", brand_id).execute()
        if not brand_res.data:
            raise HTTPException(404, "Brand not found")

        brand = brand_res.data[0]

        models_res = (
            supabase.table("car_models")
            .select("*")
            .eq("brand_id", brand_id)
            .order("range_km", desc=True)
            .execute()
        )

        # Inject brand name into every model so the frontend doesn't need a join
        enriched = []
        for m in models_res.data:
            enriched.append({
                **m,
                "brand":     brand["name"],
                "brand_logo": brand.get("logo_url"),
                # Convenience: consumption in Wh/km for display
                "consumption_wh_per_km": round(
                    (float(m["battery_capacity_kwh"]) / int(m["range_km"])) * 1000, 1
                ),
            })

        return enriched
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

# ─── Single Model ────────────────────────────────────────────

@app.get("/api/models/{model_id}", tags=["Vehicles"])
def get_model(model_id: int):
    try:
        res = (
            supabase.table("car_models")
            .select("*, car_brands(name, logo_url)")
            .eq("id", model_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(404, "Model not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

# ─── Nearby Chargers ─────────────────────────────────────────

@app.get("/api/chargers/nearby", tags=["Chargers"])
def nearby_chargers(
    lat:       float = Query(..., description="Latitude"),
    lng:       float = Query(..., description="Longitude"),
    radius_km: int   = Query(50,  description="Search radius in km"),
    limit:     int   = Query(20,  description="Max results"),
):
    """
    Returns charging stations within radius_km of the given coordinates.
    Uses a simple bounding-box filter on the Supabase table.
    For production, replace with PostGIS ST_DWithin.
    """
    try:
        deg = radius_km / 111.0   # 1° ≈ 111 km

        res = (
            supabase.table("charging_stations")
            .select("*")
            .gte("latitude",  lat - deg)
            .lte("latitude",  lat + deg)
            .gte("longitude", lng - deg)
            .lte("longitude", lng + deg)
            .eq("available", True)
            .order("power_kw", desc=True)
            .limit(limit)
            .execute()
        )

        return {
            "count":    len(res.data),
            "stations": res.data,
        }
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}")

# ─── Route Calculation ───────────────────────────────────────

@app.post("/api/route/calculate", tags=["Routing"])
def calculate_route(req: RouteRequest):
    # 1. Validate battery percent
    if not (5 <= req.current_battery_percent <= 100):
        raise HTTPException(400, "current_battery_percent must be between 5 and 100")

    # 2. Fetch car from DB
    car_res = (
        supabase.table("car_models")
        .select("*, car_brands(name)")
        .eq("id", req.car_model_id)
        .execute()
    )
    if not car_res.data:
        raise HTTPException(404, f"Car model {req.car_model_id} not found")

    car = car_res.data[0]

    # 3. Build EVSpecs — consumption is auto-derived from real battery/range data
    specs = EVSpecs(
        battery_capacity_kwh  = float(car["battery_capacity_kwh"]),
        range_km              = int(car["range_km"]),
        charging_speed_kw     = float(car.get("charging_speed_kw") or 50.0),
    )

    print(
        f"🗺️  Route: ({req.start_lat:.4f},{req.start_lng:.4f}) → "
        f"({req.end_lat:.4f},{req.end_lng:.4f}) | "
        f"{car['car_brands']['name']} {car['name']} | "
        f"Battery: {req.current_battery_percent}% | "
        f"Consumption: {specs.consumption_kwh_per_km:.4f} kWh/km"
    )

    # 4. Fetch nearby DB chargers as fallback (in case OCM is offline)
    import math
    lat_mid = (req.start_lat + req.end_lat) / 2
    lng_mid = (req.start_lng + req.end_lng) / 2
    # radius covers half the trip distance plus 60 km buffer
    trip_km  = math.hypot(req.end_lat - req.start_lat, req.end_lng - req.start_lng) * 111
    deg_radius = (trip_km / 2 + 60) / 111.0

    db_chargers_res = (
        supabase.table("charging_stations")
        .select("name, latitude, longitude, power_kw")
        .gte("latitude",  lat_mid - deg_radius)
        .lte("latitude",  lat_mid + deg_radius)
        .gte("longitude", lng_mid - deg_radius)
        .lte("longitude", lng_mid + deg_radius)
        .eq("available", True)
        .execute()
    )
    db_chargers = db_chargers_res.data or []

    # 5. Call the routing engine
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