# 🚗⚡ EV Route Planner - India

An intelligent Progressive Web App for planning electric vehicle routes in India with optimal charging stop recommendations.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)
![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Tech Stack](https://img.shields.io/badge/Maps-Leaflet-199900?style=for-the-badge&logo=leaflet)

## ✨ Features

- 🗺️ **Smart Routing** - OSMnx + NetworkX powered route calculation with battery constraints
- 🔋 **Battery Management** - Real-time range estimation and charging stop recommendations
- ⚡ **Charging Stations** - Integration with OpenChargeMap + curated database
- 📱 **Progressive Web App** - Install to home screen, offline support, responsive design
- 🚗 **Indian EV Support** - Pre-loaded with popular Indian EV models (Tata, Mahindra, MG, etc.)
- 🎯 **No Signup Required** - Use immediately, optionally save preferences

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - Fast, modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps with OpenStreetMap
- **Zustand** - Lightweight state management
- **Vite PWA** - Progressive Web App features

### Backend
- **Python 3.11+** + **FastAPI** - High-performance async API
- **OSMnx** - Road network analysis from OpenStreetMap
- **NetworkX** - Graph algorithms for route optimization
- **Supabase (PostgreSQL)** - Database and authentication
- **Uvicorn** - ASGI server

### Data Sources
- **OpenStreetMap** - Road network data
- **OpenChargeMap** - Charging station locations
- **Custom Database** - Curated EV specs and chargers

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (for frontend)
- **Python 3.11+** (for backend)
- **Supabase Account** (free tier: https://supabase.com)

### 1. Clone Repository
```bash
git clone <repository-url>
cd ev-route-planner
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your Supabase credentials

# Setup database
# 1. Go to your Supabase project
# 2. Open SQL Editor
# 3. Run the contents of database_schema.sql

# Start server
uvicorn main:app --reload
```

Backend will be running at: `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be running at: `http://localhost:5173`

### 4. Access the App

Open your browser and navigate to: `http://localhost:5173`

## 📚 Detailed Setup Guides

- [Backend Setup Guide](./backend/README.md)
- [Frontend Setup Guide](./frontend/README.md)

## 🗺️ How It Works

### Route Planning Algorithm

1. **Road Network Download**
   - OSMnx downloads actual road data from OpenStreetMap
   - Data is converted to a graph (nodes = intersections, edges = roads)

2. **Battery-Aware Routing**
   - Calculate available range based on current battery level
   - Use modified A* algorithm with battery constraints
   - Find optimal path considering distance and charging needs

3. **Charging Stop Optimization**
   - If route exceeds available range, insert charging stops
   - Greedy algorithm finds nearest charging stations along route
   - Optimizes for total time (driving + charging)

4. **Route Calculation**
   ```python
   # Simplified algorithm
   available_range = (battery_percent / 100) * vehicle_range
   
   if route_distance <= available_range:
       return direct_route
   else:
       charging_stops = find_optimal_stations(route, chargers)
       return route_with_charging_stops
   ```

## 📱 Progressive Web App Features

### Installation
- **Mobile**: Tap "Add to Home Screen" in browser menu
- **Desktop**: Look for install icon in address bar

### Offline Capabilities
- Map tiles cached for offline viewing (30 days)
- Car selection data persists in localStorage
- API responses cached (24 hours)

### Service Worker
- Automatic caching of OpenStreetMap tiles
- Background sync for route updates
- Network-first strategy for fresh data

## 🎯 User Journey

```
1. Landing Page
   ↓
2. Select Car Brand (Tata, Mahindra, MG, etc.)
   ↓
3. Select Model (Nexon EV, XUV400, ZS EV, etc.)
   ↓
4. Plan Route
   - Enter start/destination
   - Set current battery level
   - Calculate route
   ↓
5. View Route with Charging Stops
   - Interactive map visualization
   - Charging station details
   - Time and distance estimates
   ↓
6. Navigate (Future: Turn-by-turn)
```

## 🗄️ Database Schema

### car_brands
```sql
id, name, logo_url
```

### car_models
```sql
id, brand_id, name, battery_capacity_kwh, range_km, charging_speed_kw
```

### charging_stations
```sql
id, name, latitude, longitude, charger_type, power_kw, operator
```

### users (optional)
```sql
id, email, selected_car_model_id
```

## 🔧 Configuration

### Backend Environment Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENCHARGEEMAP_API_KEY=your_api_key (optional)
```

### Getting Supabase Credentials
1. Sign up at https://supabase.com
2. Create new project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

## 🎨 Customization

### Add New Car Models
```sql
INSERT INTO car_models (brand_id, name, battery_capacity_kwh, range_km, charging_speed_kw)
VALUES (1, 'Nexon EV Pro', 45.0, 500, 60.0);
```

### Add Charging Stations
```sql
INSERT INTO charging_stations (id, name, latitude, longitude, power_kw, operator)
VALUES ('CS011', 'Tata Power - Location', 23.0225, 72.5714, 60.0, 'Tata Power');
```

### Customize Theme Colors
Edit `frontend/tailwind.config.js`:
```js
colors: {
  'ev-green': {
    500: '#10b981',  // Change primary color
  }
}
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway / Render)
```bash
cd backend
# Add Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT
# Connect your Git repository
# Set environment variables in dashboard
```

### Database (Supabase)
Already hosted! Just configure connection in backend.

## 📊 Performance

- **Frontend Load Time**: < 2 seconds
- **Map Tile Loading**: Cached after first load
- **Route Calculation**: 1-3 seconds (depends on road network size)
- **API Response Time**: < 500ms (typical)

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check if port 8000 is in use
lsof -i :8000
```

### Frontend Connection Issues
- Ensure backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Clear browser cache and reload

### OSMnx Installation Fails
```bash
# Linux/Mac
pip install osmnx --no-cache-dir

# Windows - Install wheels from:
# https://www.lfd.uci.edu/~gohlke/pythonlibs/
```

### Map Not Loading
- Check Leaflet CSS is loaded in `index.html`
- Verify OpenStreetMap tiles are accessible
- Check browser console for errors

## 🧪 Testing

### Backend API Testing
```bash
# Use FastAPI's built-in docs
http://localhost:8000/docs

# Or use curl
curl http://localhost:8000/api/brands
```

### Frontend Testing
```bash
# Manual testing checklist in frontend/README.md
# Future: Add Vitest + Playwright tests
```

## 📈 Future Enhancements

- [ ] Turn-by-turn navigation
- [ ] Real-time traffic integration
- [ ] Elevation profile for range accuracy
- [ ] Multiple waypoint support
- [ ] Route sharing feature
- [ ] User authentication (Supabase Auth)
- [ ] Route history tracking
- [ ] Offline route calculation
- [ ] Voice navigation
- [ ] AR navigation mode

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **OpenStreetMap** - Road network data
- **OpenChargeMap** - Charging station database
- **OSMnx** - Road network analysis library
- **Leaflet** - Interactive map library
- **Anthropic Claude** - AI assistance in development

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Email**: your-email@example.com

## 📊 Project Status

🟢 **Active Development** - v1.0.0

- ✅ Core routing functionality
- ✅ PWA features
- ✅ Basic UI/UX
- 🚧 Real-time charger availability
- 🚧 Turn-by-turn navigation
- 🚧 User authentication

---

Made with ⚡ for the EV community in India 🇮🇳
