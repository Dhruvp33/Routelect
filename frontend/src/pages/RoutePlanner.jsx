import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { Navigation, Battery, MapPin, Search, Zap, Clock, ChevronLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// --- CUSTOM GLOWING PIN ICONS ---
const createPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="color: ${color}; position: relative; width: 40px; height: 40px;">
        <div class="pin-pulse"></div>
        <svg viewBox="0 0 24 24" fill="currentColor" class="pin-glow w-8 h-8 absolute top-1/2 left-1/2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5 2.5 2.5z" />
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40], 
    popupAnchor: [0, -40]
  })
}

const startIcon = createPinIcon('#10b981') 
const endIcon = createPinIcon('#ef4444')   

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 10) }, [center, map])
  return null
}

export default function RoutePlanner() {
  const navigate = useNavigate()
  const { selectedCar, currentBatteryPercent, setCurrentBatteryPercent } = useStore()
  
  const [startLocation, setStartLocation] = useState('Ahmedabad') 
  const [endLocation, setEndLocation] = useState('')
  const [startCoords, setStartCoords] = useState(null)
  const [endCoords, setEndCoords] = useState(null)
  const [mapCenter, setMapCenter] = useState([23.0225, 72.5714]) 
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)

  // Hides the global "Plan Route" button while on this page
  // (Note: This assumes you have a way to control the Navbar, if not, it just works visually)
  useEffect(() => {
     // Optional: You can manipulate DOM or Global State here if needed to hide Navbar items
  }, [])

  useEffect(() => { if (!selectedCar) navigate('/select-brand') }, [selectedCar, navigate])

  const searchLocation = async (query, type) => {
    if (!query) return
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' India')}`)
      const data = await response.json()
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        if (type === 'start') { setStartCoords(coords); setMapCenter(coords); }
        else { setEndCoords(coords); setMapCenter(coords); }
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => { if(startLocation) searchLocation(startLocation, 'start') }, [])

  const handleCalculate = async () => {
    if (!startCoords || !endCoords) return
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/route/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: startCoords[0], start_lng: startCoords[1],
          end_lat: endCoords[0], end_lng: endCoords[1],
          current_battery_percent: currentBatteryPercent,
          car_model_id: selectedCar.id
        })
      })
      const data = await res.json()
      setRoute(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (!selectedCar) return null

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex bg-[#0B0F19] overflow-hidden relative">
      
      {/* 1. SIDEBAR - FIXED LEFT */}
      {/* We use 'z-[100]' to sit nicely, and flex-col to manage scrolling */}
      <div className="w-[400px] h-full glass-sidebar flex flex-col z-[100] relative shadow-2xl border-r border-white/5">
        
        {/* PART A: HEADER (Fixed - No Scrolling) */}
        {/* Added 'backdrop-blur' and 'bg-opacity' so scrolling text doesn't show behind it */}
        <div className="flex-none p-6 pb-4 border-b border-gray-700/50 bg-[#0d121e]/90 backdrop-blur-md z-20">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/select-brand')} className="flex items-center text-xs text-gray-400 hover:text-white transition-colors group">
               <ChevronLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform"/> Change Vehicle
            </button>
            {/* CONNECTION STATUS */}
            <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-xs text-green-400 font-mono">System Online</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-wide mb-1">Route Planner</h1>
          <p className="text-sm text-gray-400">{selectedCar.brand} {selectedCar.name} Edition</p>
        </div>

        {/* PART B: SCROLLABLE CONTENT (Flexible Height) */}
        {/* 'no-scrollbar' class is applied here to hide the ugly line */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 relative">
          
          {/* Input Group */}
          <div className="relative space-y-4">
             {/* Connector Line */}
            <div className="absolute left-[2.85rem] top-10 bottom-10 w-0.5 bg-gray-700/50 -z-10"></div>

            <div className="relative group">
              <div className="absolute left-4 top-3.5 text-green-500 z-10 bg-[#161b27] rounded-full p-0.5"><MapPin size={20} /></div>
              <input 
                type="text" 
                placeholder="Start Location" 
                className="w-full bg-gray-900/60 border border-gray-700 rounded-xl py-3.5 pl-14 pr-4 text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                onBlur={() => searchLocation(startLocation, 'start')}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation(startLocation, 'start')}
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-3.5 text-red-500 z-10 bg-[#161b27] rounded-full p-0.5"><MapPin size={20} /></div>
              <input 
                type="text" 
                placeholder="Where to?" 
                className="w-full bg-gray-900/60 border border-gray-700 rounded-xl py-3.5 pl-14 pr-4 text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                onBlur={() => searchLocation(endLocation, 'end')}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation(endLocation, 'end')}
              />
            </div>
          </div>

          {/* Slider */}
          <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50">
            <div className="flex justify-between mb-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <Battery className="w-3 h-3 mr-2" /> Initial Charge
              </label>
              <span className={`text-lg font-bold ${currentBatteryPercent > 20 ? 'text-white' : 'text-red-500'} font-mono`}>
                {currentBatteryPercent}%
              </span>
            </div>
            
            <div className="relative h-6 flex items-center">
                <input 
                type="range" min="0" max="100" 
                value={currentBatteryPercent}
                onChange={(e) => setCurrentBatteryPercent(parseInt(e.target.value))}
                className="range-slider"
                />
            </div>
          </div>

          {/* Results Area */}
          {route && (
            <div className="space-y-4 animate-fade-in pb-4">
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                    <div className="text-gray-400 text-xs mb-1">Distance</div>
                    <div className="text-2xl font-bold text-white tracking-tight">{route.total_distance_km} <span className="text-sm font-normal text-gray-500">km</span></div>
                 </div>
                 <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                    <div className="text-gray-400 text-xs mb-1">Est. Time</div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                       {Math.floor(route.estimated_total_time_minutes / 60)}<span className="text-sm font-normal text-gray-500">h</span> {route.estimated_total_time_minutes % 60}<span className="text-sm font-normal text-gray-500">m</span>
                    </div>
                 </div>
              </div>

              {route.needs_charging ? (
                <div className="bg-yellow-900/10 border border-yellow-500/30 p-4 rounded-xl">
                    <div className="flex items-start">
                        <Zap className="text-yellow-500 w-5 h-5 mr-3 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-yellow-500 mb-1">Charging Stop Required</h4>
                            {route.charging_stops.map((stop, i) => (
                                <div key={i} className="text-xs text-gray-300 mt-2 pl-2 border-l-2 border-yellow-500/30">
                                    <p className="font-medium text-white">{stop.station_name}</p>
                                    <p>Stop for <span className="text-white font-bold">{stop.charging_time_minutes} min</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              ) : (
                <div className="bg-green-900/10 border border-green-500/30 p-3 rounded-xl flex items-center justify-center text-green-400 text-sm font-medium">
                    <Zap className="w-4 h-4 mr-2" /> Direct Trip Possible
                </div>
              )}
            </div>
          )}
        </div>

        {/* PART C: FOOTER (Fixed) */}
        <div className="flex-none p-6 pt-4 border-t border-gray-800 bg-[#0d121e] z-20">
          <button 
            onClick={handleCalculate}
            disabled={loading || !startCoords || !endCoords}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {loading ? 'Calculating...' : 'Find Route'}
          </button>
        </div>
      </div>

      {/* 2. MAP AREA */}
      <div className="flex-1 h-full relative z-0">
        <MapContainer center={mapCenter} zoom={6} zoomControl={false} className="w-full h-full">
          <TileLayer
            className="dark-map-tiles"
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          
          {startCoords && <Marker position={startCoords} icon={startIcon}><Popup>Start Point</Popup></Marker>}
          {endCoords && <Marker position={endCoords} icon={endIcon}><Popup>Destination</Popup></Marker>}
          
          {route && route.route_coords && (
             <Polyline 
               positions={route.route_coords} 
               pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8, lineCap: 'round' }} 
             />
          )}
        </MapContainer>
      </div>
    </div>
  )
}