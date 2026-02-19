import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Battery, Zap, ChevronLeft } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function ModelSelection() {
  const { brandId } = useParams()
  const navigate = useNavigate()
  const { setSelectedCar } = useStore()
  const [models, setModels] = useState([])

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/brands/${brandId}/models`)
      .then(res => res.json())
      .then(data => setModels(data))
  }, [brandId])

  const handleSelect = (model) => {
    setSelectedCar(model)
    navigate('/plan-route')
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 pt-24">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Brands
        </button>

        <h2 className="text-3xl font-bold mb-8 text-center animate-fade-in">Select Your Model</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model)}
              className="glass-panel p-6 rounded-2xl text-left hover:bg-gray-800 transition-all hover:border-green-500/50 group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-green-400 transition-colors">{model.name}</h3>
                <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-400 border border-gray-700">
                  {model.range_km} km
                </span>
              </div>
              
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center">
                  <Battery className="w-4 h-4 mr-3 text-green-500" />
                  Battery: <span className="text-white ml-auto">{model.battery_capacity_kwh} kWh</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-3 text-yellow-500" />
                  Charging: <span className="text-white ml-auto">{model.charging_speed_kw} kW</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}