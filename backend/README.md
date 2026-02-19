# EV Route Planner - Backend

FastAPI-based backend for intelligent EV route planning with battery constraints and charging station integration.

## 🛠️ Tech Stack

- **Python 3.11+**
- **FastAPI** - Modern, fast web framework
- **Supabase** - PostgreSQL database and authentication
- **OSMnx** - Download and analyze OpenStreetMap road networks
- **NetworkX** - Graph algorithms for routing
- **Uvicorn** - ASGI server

## 📋 Prerequisites

- Python 3.11 or higher
- pip package manager
- Supabase account (free tier available at https://supabase.com)

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** OSMnx installation might take a few minutes as it includes GeoPandas and other geospatial libraries.

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
OPENCHARGEEMAP_API_KEY=your_openchargeemap_api_key_here
```

**Getting Supabase Credentials:**
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key

### 3. Setup Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database_schema.sql`
4. Click "Run" to execute the schema

This will create:
- `car_brands` table with sample Indian EV brands
- `car_models` table with popular Indian EVs
- `charging_stations` table with sample charging locations
- `users` table for user management

### 4. Run the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

API Documentation (auto-generated): `http://localhost:8000/docs`

## 📡 API Endpoints

### Health Check
- `GET /` - Check if backend is running

### Car Brands & Models
- `GET /api/brands` - Get all car brands
- `GET /api/brands/{brand_id}/models` - Get EV models for a brand
- `GET /api/models/{model_id}` - Get detailed specs for a model

### Charging Stations
- `GET /api/chargers/nearby?lat=23.0225&lng=72.5714&radius_km=50` - Find nearby chargers

### Route Planning
- `POST /api/route/calculate` - Calculate optimal EV route with charging stops

**Example Request:**
```json
{
  "start_lat": 23.0225,
  "start_lng": 72.5714,
  "end_lat": 19.0760,
  "end_lng": 72.8777,
  "current_battery_percent": 80,
  "car_model_id": 1
}
```

### User Management
- `POST /api/users/register` - Register new user

## 🧪 Testing the Routing Engine

The `routing_engine.py` module contains the core EV routing logic. To test it:

```python
from routing_engine import EVRouter, EVSpecs, ChargingStation

# Initialize router for Ahmedabad
router = EVRouter("Ahmedabad, Gujarat, India")
router.load_road_network()

# Create EV specs (Tata Nexon EV)
nexon_specs = EVSpecs.from_range(
    battery_kwh=40.5,
    range_km=437,
    charging_kw=50.0
)

# Calculate simple route
route = router.find_route_simple(
    start_lat=23.0225,
    start_lng=72.5714,
    end_lat=23.0395,
    end_lng=72.5269
)

print(f"Distance: {route['total_distance_km']} km")
```

## 🗺️ How the Routing Works

1. **Road Network Download**: OSMnx downloads actual road data from OpenStreetMap
2. **Graph Creation**: Roads become a graph (nodes = intersections, edges = road segments)
3. **Shortest Path**: NetworkX finds optimal route using Dijkstra's algorithm
4. **Battery Constraints**: Custom logic checks if route is achievable with current battery
5. **Charging Stops**: If needed, finds optimal charging stations along route
6. **Route Optimization**: Balances distance, time, and charging stops

## 📊 Database Schema

### car_brands
- `id` - Primary key
- `name` - Brand name (e.g., "Tata Motors")
- `logo_url` - Brand logo URL

### car_models
- `id` - Primary key
- `brand_id` - Foreign key to car_brands
- `name` - Model name (e.g., "Nexon EV")
- `battery_capacity_kwh` - Battery size in kWh
- `range_km` - ARAI certified range
- `charging_speed_kw` - Maximum DC charging speed

### charging_stations
- `id` - Station ID
- `latitude`, `longitude` - GPS coordinates
- `power_kw` - Charger power rating
- `charger_type` - CCS2, Type 2, etc.
- `operator` - Tata Power, Statiq, etc.

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anon/public key | Yes |
| `OPENCHARGEEMAP_API_KEY` | OpenChargeMap API key | Optional |

## 🚨 Common Issues & Solutions

### OSMnx Installation Errors
If you get errors installing OSMnx:
```bash
# On Linux/Mac
pip install osmnx --no-cache-dir

# On Windows, you might need to install wheels from:
# https://www.lfd.uci.edu/~gohlke/pythonlibs/
```

### Network Download Slow
First time downloading a city's road network can take 1-5 minutes. The data is cached locally.

### Supabase Connection Error
- Verify your `.env` file has correct credentials
- Check if your Supabase project is active
- Ensure you're using the "anon public" key, not the service role key

## 📈 Performance Tips

1. **Cache Road Networks**: OSMnx caches downloaded networks in `~/.osmnx/cache/`
2. **Use Redis**: Add Redis for caching routes and charger data
3. **Database Indexing**: Already included in schema for lat/lng searches
4. **Rate Limiting**: Implement rate limiting for production use

## 🔐 Security Notes

- **Never commit `.env` file** - it contains sensitive keys
- Use Supabase RLS (Row Level Security) for production
- For production, replace basic user auth with Supabase Auth
- Implement API rate limiting (e.g., using `slowapi`)

## 📝 Next Steps

- [ ] Integrate OpenChargeMap API for live charger data
- [ ] Add route caching with Redis
- [ ] Implement real-time charging station availability
- [ ] Add elevation data for better range estimation
- [ ] Support multiple waypoints
- [ ] Add traffic data integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for personal and commercial projects

## 🆘 Support

For issues or questions:
- Check API docs at `/docs` endpoint
- Review Supabase logs in dashboard
- Check OSMnx documentation: https://osmnx.readthedocs.io/
