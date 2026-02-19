import { Link } from 'react-router-dom'
import { MapPin, Zap, Navigation, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <span className="text-sm text-gray-300">Live for India 🇮🇳</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            Plan Your EV Trip <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              Without Anxiety
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            The smartest route planner for Indian roads. We calculate battery usage, 
            find compatible chargers, and get you to your destination safely.
          </p>

          <Link 
            to="/select-brand" 
            className="group inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-green-600 rounded-full hover:bg-green-500 transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Get Started
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-32">
          <FeatureCard 
            icon={<Navigation className="w-8 h-8 text-blue-400" />}
            title="Smart Routing"
            desc="Algorithms that know Indian roads and traffic patterns."
          />
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="Real Chargers"
            desc="Database of 1000+ verified charging stations across India."
          />
          <FeatureCard 
            icon={<MapPin className="w-8 h-8 text-green-400" />}
            title="Range Accurate"
            desc="Precise battery consumption based on your specific car model."
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-panel p-8 rounded-2xl hover:bg-gray-800/50 transition-colors">
      <div className="mb-4 p-3 bg-gray-800/50 rounded-xl inline-block">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}