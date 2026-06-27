import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ReportPage from './pages/ReportPage'
import DashboardPage from './pages/DashboardPage'
import MapPage from './pages/MapPage'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App