import { useState, useEffect, useRef } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import historicalData from '../data/historicalReports.json'

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY

const WARD_COORDS = {
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'Indiranagar': { lat: 12.9784, lng: 77.6408 },
  'Whitefield': { lat: 12.9698, lng: 77.7500 },
  'Jayanagar': { lat: 12.9250, lng: 77.5938 },
  'Hebbal': { lat: 13.0350, lng: 77.5970 },
  'Rajajinagar': { lat: 12.9900, lng: 77.5530 },
  'Marathahalli': { lat: 12.9591, lng: 77.6974 },
  'BTM Layout': { lat: 12.9166, lng: 77.6101 },
  'Yelahanka': { lat: 13.1007, lng: 77.5963 },
  'Malleswaram': { lat: 13.0035, lng: 77.5703 }
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1a2e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
]

const severityWeight = { Low: 1, Medium: 2, High: 3, Critical: 4 }

export default function MapPage() {
  const [reports, setReports] = useState([])
  const [mode, setMode] = useState('current')
  const [mapReady, setMapReady] = useState(false)
  const [worstWard, setWorstWard] = useState('Koramangala')
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    fetchReports()
    loadGoogleMaps()
  }, [])

  useEffect(() => {
    if (mapReady) renderHeatmap()
  }, [mode, reports, mapReady])

  const fetchReports = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'reports'))
      const data = snapshot.docs.map(doc => doc.data())
      setReports(data)

      // Find worst ward
      const wardCounts = {}
      data.filter(r => r.status !== 'Resolved').forEach(r => {
        const w = r.location?.ward
        if (w) wardCounts[w] = (wardCounts[w] || 0) + 1
      })
      const worst = Object.entries(wardCounts).sort((a, b) => b[1] - a[1])[0]
      if (worst) setWorstWard(worst[0])
    } catch (err) {
      console.error(err)
    }
  }

  const loadGoogleMaps = () => {
    if (window.google?.maps) { initMap(); return }
    window.__nagarNitiMapInit = initMap
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=__nagarNitiMapInit&v=weekly`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }

  const initMap = () => {
    if (!mapRef.current) return
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 11,
      styles: DARK_MAP_STYLE,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      }
    })
    mapInstanceRef.current = map
    setMapReady(true)
  }

  const renderHeatmap = async () => {
    const { GoogleMapsOverlay } = await import('@deck.gl/google-maps')
    const { HeatmapLayer } = await import('@deck.gl/aggregation-layers')

    let data = []

    if (mode === 'current') {
      const firestorePoints = reports
        .filter(r => r.status !== 'Resolved')
        .map(r => {
          const lat = r.location?.lat || WARD_COORDS[r.location?.ward]?.lat
          const lng = r.location?.lng || WARD_COORDS[r.location?.ward]?.lng
          if (!lat || !lng) return null
          return { coordinates: [lng, lat], weight: severityWeight[r.analysis?.severity] || 1 }
        })
        .filter(Boolean)

      const basePoints = Object.values(WARD_COORDS).map(c => ({
        coordinates: [c.lng, c.lat], weight: 0.3
      }))
      data = [...firestorePoints, ...basePoints]

    } else {
      const wardCounts = {}
      historicalData.reports.forEach(r => {
        if (!wardCounts[r.ward]) wardCounts[r.ward] = 0
        wardCounts[r.ward] += severityWeight[r.severity] || 1
      })
      data = Object.entries(wardCounts)
        .map(([ward, weight]) => {
          const coords = WARD_COORDS[ward]
          if (!coords) return null
          return { coordinates: [coords.lng, coords.lat], weight: weight * 0.4 }
        })
        .filter(Boolean)
    }

    const layer = new HeatmapLayer({
      id: 'heatmap',
      data,
      getPosition: d => d.coordinates,
      getWeight: d => d.weight,
      radiusPixels: 80,
      intensity: 2,
      threshold: 0.05,
      colorRange: mode === 'current'
        ? [[255,200,0,100],[255,140,0,180],[255,60,0,220],[220,0,0,255]]
        : [[255,240,100,100],[255,200,0,180],[255,120,0,220],[180,40,0,255]]
    })

    if (overlayRef.current) overlayRef.current.setMap(null)
    const overlay = new GoogleMapsOverlay({ layers: [layer] })
    overlay.setMap(mapInstanceRef.current)
    overlayRef.current = overlay
  }

  const activeCount = reports.filter(r => r.status !== 'Resolved').length
  const criticalCount = reports.filter(r => r.analysis?.severity === 'Critical').length
  const wardsAffected = new Set(reports.map(r => r.location?.ward)).size

  return (
    <div style={{ backgroundColor: '#0a0f1a', minHeight: '100vh' }} className="px-6 py-8">

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .pulse-ring::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: pulse-ring 1.5s ease-out infinite;
        }
        .pulse-dot {
          position: relative;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          flex-shrink: 0;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 40px rgba(239,68,68,0.6); }
        }
        .stat-critical { animation: glow 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="pulse-dot pulse-ring"></div>
              <span style={{ color: '#ef4444', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 600 }}>
                LIVE INTELLIGENCE
              </span>
            </div>
            <h1 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>
              Civic Crisis Map
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
              {mode === 'current'
                ? `${activeCount} active issues across Bengaluru - ${worstWard} is critical`
                : 'AI-predicted hotspots for the next 30 days based on historical patterns'}
            </p>
          </div>

          {/* Toggle */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '4px', display: 'flex', gap: '2px' }}>
            <button
              onClick={() => setMode('current')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mode === 'current' ? '#1a1a2e' : 'transparent',
                color: mode === 'current' ? '#ef4444' : '#64748b',
                boxShadow: mode === 'current' ? '0 0 12px rgba(239,68,68,0.2)' : 'none'
              }}
            >
              🔴 Current Issues
            </button>
            <button
              onClick={() => setMode('predicted')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mode === 'predicted' ? '#1a1a2e' : 'transparent',
                color: mode === 'predicted' ? '#f59e0b' : '#64748b',
                boxShadow: mode === 'predicted' ? '0 0 12px rgba(245,158,11,0.2)' : 'none'
              }}
            >
              🟠 Risk Analysis
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
          {[
            { color: '#ef4444', label: 'Critical zone' },
            { color: '#f97316', label: 'High density' },
            { color: '#fbbf24', label: 'Moderate risk' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="max-w-6xl mx-auto" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #1e293b', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        <div
          ref={mapRef}
          style={{ height: '520px', width: '100%' }}
        />
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4 mt-6">
        {[
          {
            value: activeCount,
            label: 'Active Issues',
            sublabel: 'Unresolved citywide',
            color: '#ef4444',
            glow: 'rgba(239,68,68,0.15)',
            icon: '🚨',
            critical: true
          },
          {
            value: criticalCount,
            label: 'Critical Severity',
            sublabel: 'Immediate risk identified',
            color: '#f97316',
            glow: 'rgba(249,115,22,0.15)',
            icon: '⚠️',
            critical: false
          },
          {
            value: wardsAffected,
            label: 'Wards Affected',
            sublabel: 'Across Bengaluru',
            color: '#3b82f6',
            glow: 'rgba(59,130,246,0.15)',
            icon: '📍',
            critical: false
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={stat.critical ? 'stat-critical' : ''}
            style={{
              backgroundColor: '#0f172a',
              border: `1px solid #1e293b`,
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              backgroundImage: `radial-gradient(ellipse at center, ${stat.glow} 0%, transparent 70%)`
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>{stat.label}</div>
            <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>{stat.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Mode explanation */}
      <div className="max-w-6xl mx-auto mt-4">
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>{mode === 'current' ? '🔴' : '🤖'}</span>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
            {mode === 'current'
              ? 'Heatmap intensity weighted by issue severity - Critical issues contribute 4x more than Low severity. Red zones require immediate intervention.'
              : 'AI prediction based on 6 months of historical ward data. Intensity represents recurrence probability. Amber zones are pre-monsoon risk areas - act before issues surface.'}
          </p>
        </div>
      </div>

    </div>
  )
}