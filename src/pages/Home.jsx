import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const steps = 40
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, interval)
    return () => clearInterval(timer)
  }, [target])
  return <span>{count}</span>
}

function Home() {
  const [stats, setStats] = useState({ total: 0, open: 0, critical: 0, wards: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'reports'))
      const data = snapshot.docs.map(doc => doc.data())
      setStats({
        total: data.length,
        open: data.filter(r => r.status !== 'Resolved').length,
        critical: data.filter(r => r.analysis?.severity === 'Critical').length,
        wards: new Set(data.map(r => r.location?.ward)).size
      })
    } catch (err) {
      console.error(err)
    }
  }

  const steps = [
    { icon: '📸', step: '01', title: 'Snap & Report', desc: 'Citizen takes one photo of the issue and drops a location pin. That\'s it.' },
    { icon: '🤖', step: '02', title: 'AI Analyzes', desc: 'Vision AI identifies issue type, severity, authority, and checks for hotspot patterns.' },
    { icon: '📝', step: '03', title: 'Complaint Drafted', desc: 'Agent auto-generates a formal complaint addressed to the exact right authority.' },
    { icon: '🔁', step: '04', title: 'Auto-Escalation', desc: 'If unresolved in 7 days, agent escalates. Ward Officer → Zonal Commissioner → BBMP Chief.' },
    { icon: '📊', step: '05', title: 'Public Accountability', desc: 'Ignored issues go public. Ward scores updated. Authorities feel the pressure.' },
  ]

  return (
    <div style={{ backgroundColor: '#0a0f1a', minHeight: '100vh' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.6s ease 0.2s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.6s ease 0.4s forwards; opacity: 0; }
        .step-card:hover { transform: translateY(-4px); border-color: #334155 !important; }
        .step-card { transition: all 0.2s ease; }
        .cta-btn:hover { background: #2563eb !important; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59,130,246,0.4) !important; }
        .cta-btn { transition: all 0.2s ease; }
      `}</style>

      {/* Hero */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '80px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>

          {/* Badge */}
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '100px', padding: '6px 16px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></div>
            <span style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '0.1em', fontWeight: 500 }}>BENGALURU CIVIC INTELLIGENCE AGENT</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-2" style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '20px', color: '#f1f5f9' }}>
            The AI that won't let<br />
            <span style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Bengaluru ignore you
            </span>
          </h1>

          <p className="fade-up-3" style={{ color: '#64748b', fontSize: '18px', maxWidth: '540px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Report once. NagarNiti's agent files the complaint, escalates automatically, 
            and publicly scores your ward until the issue is fixed.
          </p>

          <div className="fade-up-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/report"
              className="cta-btn"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                display: 'inline-block'
              }}
            >
              Report an Issue →
            </Link>
            <Link
              to="/map"
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: '15px',
                textDecoration: 'none',
                border: '1px solid #1e293b',
                display: 'inline-block'
              }}
            >
              View Crisis Map
            </Link>
          </div>
        </div>

        {/* Live Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '80px' }}>
          {[
            { value: stats.total, label: 'Reports Filed', color: '#3b82f6', suffix: '' },
            { value: stats.open, label: 'Open Issues', color: '#f97316', suffix: '' },
            { value: stats.critical, label: 'Critical Alerts', color: '#ef4444', suffix: '' },
            { value: stats.wards, label: 'Wards Monitored', color: '#22c55e', suffix: '' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              backgroundImage: `radial-gradient(ellipse at top, ${stat.color}15 0%, transparent 70%)`
            }}>
              <div style={{ fontSize: '40px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                <AnimatedCounter target={stat.value} />
              </div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.15em', fontWeight: 600, marginBottom: '8px' }}>THE AGENT LOOP</p>
            <h2 style={{ color: '#f1f5f9', fontSize: '32px', fontWeight: 700 }}>One photo. Five agent steps.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="step-card"
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '16px',
                  padding: '20px 16px',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px', animation: `float ${2 + i * 0.3}s ease-in-out infinite` }}>{step.icon}</div>
                <div style={{ color: '#334155', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>{step.step}</div>
                <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{step.title}</div>
                <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation highlight */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '40px',
          backgroundImage: 'radial-gradient(ellipse at top left, rgba(239,68,68,0.08) 0%, transparent 60%)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#ef4444', fontSize: '12px', letterSpacing: '0.15em', fontWeight: 600, marginBottom: '12px' }}>THE ACCOUNTABILITY ENGINE</p>
              <h3 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 700, lineHeight: 1.3, marginBottom: '16px' }}>
                Authorities can't ignore what they can't hide
              </h3>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                Every ward gets a public grade. F-rated wards are visible to citizens, journalists, and councillors. 
                The agent doesn't stop escalating until someone responds.
              </p>
              <Link to="/dashboard" style={{
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                View Ward Scorecard →
              </Link>
            </div>

            {/* Escalation ladder visual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { day: 'Day 0', label: 'Ward Officer notified', color: '#3b82f6', active: true },
                { day: 'Day 7', label: 'Zonal Commissioner escalated', color: '#f59e0b', active: false },
                { day: 'Day 14', label: 'BBMP Commissioner alerted', color: '#f97316', active: false },
                { day: 'Day 21', label: 'Public shame report filed', color: '#ef4444', active: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: item.active ? item.color : '#1e293b',
                    border: `2px solid ${item.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: item.active ? 'white' : item.color,
                    flexShrink: 0,
                    boxShadow: item.active ? `0 0 12px ${item.color}60` : 'none'
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <span style={{ color: item.color, fontSize: '11px', fontWeight: 600 }}>{item.day} — </span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home