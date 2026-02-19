import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Search } from 'lucide-react'

export default function BrandSelection() {
  const [brands, setBrands] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/brands') // Updated to 127.0.0.1
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error("API Error", err))
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 pt-24">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center animate-fade-in">Select Your Car Brand</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => navigate(`/select-model/${brand.id}`)}
              className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-800 transition-all hover:scale-105 hover:border-green-500/50 group"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 p-4 shadow-lg group-hover:shadow-green-500/20 transition-shadow">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                ) : (
                  <Car className="text-black w-10 h-10" />
                )}
              </div>
              <span className="font-semibold text-lg">{brand.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}