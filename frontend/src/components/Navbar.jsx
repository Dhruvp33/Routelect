import { Link } from 'react-router-dom'
import { Battery, MapPin, Car, Menu } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useState } from 'react'

export default function Navbar() {
  const { selectedCar, clearData, backendStatus } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Battery className="h-8 w-8 text-ev-green-500" />
            <span className="text-xl font-bold">EV Planner</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/select-brand" 
              className="flex items-center space-x-2 hover:text-ev-green-400 transition"
            >
              <Car className="h-5 w-5" />
              <span>Select Car</span>
            </Link>
            
            <Link 
              to="/plan-route" 
              className="flex items-center space-x-2 hover:text-ev-green-400 transition"
            >
              <MapPin className="h-5 w-5" />
              <span>Plan Route</span>
            </Link>

            {/* Backend Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${backendStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {backendStatus ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Selected Car Display */}
            {selectedCar && (
              <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                {selectedCar.brand} {selectedCar.model}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link 
              to="/select-brand" 
              className="block hover:text-ev-green-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              <Car className="h-5 w-5 inline mr-2" />
              Select Car
            </Link>
            
            <Link 
              to="/plan-route" 
              className="block hover:text-ev-green-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              <MapPin className="h-5 w-5 inline mr-2" />
              Plan Route
            </Link>

            {selectedCar && (
              <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                Current: {selectedCar.brand} {selectedCar.model}
              </div>
            )}

            <button 
              onClick={() => {
                clearData()
                setMenuOpen(false)
              }}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
