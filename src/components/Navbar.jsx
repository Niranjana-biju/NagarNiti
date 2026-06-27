import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const links = [
    { path: '/', label: 'Home' },
    { path: '/report', label: 'Report Issue' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/map', label: 'Crisis Map' },
  ]

  return (
    <nav style={{
      backgroundColor: 'rgba(10,15,26,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1e293b',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{ fontSize: '24px' }}>🏙️</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#f1f5f9', letterSpacing: '-0.3px' }}>NagarNiti</span>
            <span style={{ color: '#475569', fontSize: '11px', marginLeft: '8px', letterSpacing: '0.05em' }}>CIVIC INTELLIGENCE</span>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '4px' }}>
          {links.map(link => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: active ? '#1e293b' : 'transparent',
                  color: active ? '#f1f5f9' : '#64748b',
                  border: active ? '1px solid #334155' : '1px solid transparent'
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{ color: '#475569', fontSize: '11px', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </nav>
  )
}

export default Navbar