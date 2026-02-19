import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BrandSelection from './pages/BrandSelection'
import ModelSelection from './pages/ModelSelection'
import RoutePlanner from './pages/RoutePlanner'
import Navbar from './components/Navbar'
import { useStore } from './store/useStore'

function App() {
  const { selectedCar, setBackendStatus } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check backend status
    fetch('http://127.0.0.1:8000/')
      .then(res => res.json())
      .then(data => {
        setBackendStatus(true)
        console.log('Backend connected:', data.message)
      })
      .catch(err => {
        setBackendStatus(false)
        console.error('Backend connection failed:', err)
      })
      .finally(() => setLoading(false))
  }, [setBackendStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-ev-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading EV Route Planner...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/select-brand" element={<BrandSelection />} />
        <Route path="/select-model/:brandId" element={<ModelSelection />} />
        <Route path="/plan-route" element={<RoutePlanner />} />
      </Routes>
    </div>
  )
}

export default App
