from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Import our updated engine
from routing_engine import EVRouter, EVSpecs

load_dotenv()

app = FastAPI(title="Routelect API")

# --- CORS: Allow Frontend to talk to Backend ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase Setup ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key) if url and key else None

# --- Initialize Engine (Now using OCM API) ---
print("🚀 Initializing Routing Engine...")
router_engine = EVRouter() 

# --- Models ---
class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    current_battery_percent: float
    car_model_id: int

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "healthy", "mode": "Live OCM API"}

@app.get("/api/brands")
def get_brands():
    return supabase.table("car_brands").select("*").execute().data

@app.get("/api/brands/{brand_id}/models")
def get_models(brand_id: int):
    return supabase.table("car_models").select("*").eq("brand_id", brand_id).execute().data

@app.post("/api/route/calculate")
def calculate_route(req: RouteRequest):
    # 1. Get Car Info from DB
    car_res = supabase.table("car_models").select("*").eq("id", req.car_model_id).execute()
    if not car_res.data:
        raise HTTPException(404, "Car not found")
    car = car_res.data[0]

    # 2. Prepare Specs
    specs = EVSpecs(
        battery_capacity_kwh=float(car["battery_capacity_kwh"]),
        range_km=int(car["range_km"]),
        charging_speed_kw=float(car.get("charging_speed_kw", 50.0)),
        consumption_kwh_per_km=0.15 
    )

    print(f"Calculating Route: {req.start_lat},{req.start_lng} -> {req.end_lat},{req.end_lng}")
    
    # 3. CALL ROUTER (Pass 'None' for chargers, it uses API now)
    # The engine will fetch chargers from Open Charge Map automatically
    result = router_engine.find_route_with_charging(
        req.start_lat, req.start_lng, 
        req.end_lat, req.end_lng, 
        req.current_battery_percent, 
        specs, 
        None 
    )
    
    if "error" in result:
        raise HTTPException(400, result["error"])
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)