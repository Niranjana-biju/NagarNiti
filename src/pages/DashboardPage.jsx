import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const WARDS = [
  'Koramangala', 'Indiranagar', 'Whitefield',
  'Jayanagar', 'Hebbal', 'Rajajinagar',
  'Marathahalli', 'BTM Layout', 'Yelahanka', 'Malleswaram'
]

const getGrade = (rate) => {
  if (rate >= 80) return { grade: 'A', color: '#22c55e' }
  if (rate >= 60) return { grade: 'B', color: '#84cc16' }
  if (rate >= 40) return { grade: 'C', color: '#eab308' }
  if (rate >= 20) return { grade: 'D', color: '#f97316' }
  return { grade: 'F', color: '#ef4444' }
}

const severityColor = {
  Low: { bg: '#052e16', text: '#22c55e', border: '#166534' },
  Medium: { bg: '#1c1917', text: '#eab308', border: '#854d0e' },
  High: { bg: '#1c0a00', text: '#f97316', border: '#9a3412' },
  Critical: { bg: '#1c0000', text: '#ef4444', border: '#991b1b' }
}

const statusColor = {
  Reported: { bg: '#0c1a3a', text: '#3b82f6', border: '#1e3a8a' },
  Acknowledged: { bg: '#1a0a3a', text: '#a855f7', border: '#6b21a8' },
  'In Progress': { bg: '#1c1500', text: '#eab308', border: '#854d0e' },
  Resolved: { bg: '#052e16', text: '#22c55e', border: '#166534' }
}

const escalationLabel = {
  0: { label: 'Ward Officer', color: '#3b82f6' },
  1: { label: 'Zonal Comm.', color: '#f59e0b' },
  2: { label: 'BBMP Chief', color: '#f97316' },
  3: { label: '🚨 Public Record', color: '#ef4444' }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px 16px' }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>{payload[0]?.payload?.fullWard}</p>
        <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600 }}>
          {payload[0]?.value}% resolution rate
        </p>
        <p style={{ color: '#475569', fontSize: '12px' }}>
          {payload[0]?.payload?.resolved}/{payload[0]?.payload?.total} resolved
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [wardData, setWardData] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs
      .map(doc => ({ ...doc.data(), docId: doc.id }))
      .filter(r =>
      r.analysis?.issue_type !== 'Not Applicable' &&
      r.analysis?.issue_type !== 'Not a civic issue' &&
      r.analysis?.category !== 'Not Applicable'
  )
      setReports(data)
      calculateWardScores(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateWardScores = (data) => {
    const scores = WARDS.map(ward => {
      const wardReports = data.filter(r => r.location?.ward === ward)
      const total = wardReports.length
      const resolved = wardReports.filter(r => r.status === 'Resolved').length
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100
      const { grade, color } = getGrade(rate)
      return { ward: ward.split(' ')[0], fullWard: ward, total, resolved, rate, grade, color }
    })
    setWardData(scores)
  }

  const toggleResolved = async (docId, currentStatus) => {
  try {
    const newStatus = currentStatus === 'Resolved' ? 'Reported' : 'Resolved'
    await updateDoc(doc(db, 'reports', docId), { status: newStatus })
    fetchReports()
  } catch (err) {
    console.error(err)
  }
}

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true
    if (filter === 'open') return r.status !== 'Resolved'
    if (filter === 'critical') return r.analysis?.severity === 'Critical'
    if (filter === 'resolved') return r.status === 'Resolved'
    return true
  })

  const totalReports = reports.length
  const openReports = reports.filter(r => r.status !== 'Resolved').length
  const resolvedReports = reports.filter(r => r.status === 'Resolved').length
  const criticalReports = reports.filter(r => r.analysis?.severity === 'Critical').length

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
          <p style={{ color: '#475569' }}>Loading intelligence dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0a0f1a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.15em', fontWeight: 600, marginBottom: '6px' }}>REAL-TIME ACCOUNTABILITY</p>
          <h1 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 700 }}>Civic Dashboard</h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px' }}>Ward-level intelligence across Bengaluru</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Reports', value: totalReports, color: '#3b82f6', glow: 'rgba(59,130,246,0.15)', icon: '📋', filter: 'all' },
            { label: 'Open Issues', value: openReports, color: '#f97316', glow: 'rgba(249,115,22,0.15)', icon: '🔓', filter: 'open' },
            { label: 'Resolved', value: resolvedReports, color: '#22c55e', glow: 'rgba(34,197,94,0.15)', icon: '✅', filter: 'resolved' },
            { label: 'Critical', value: criticalReports, color: '#ef4444', glow: 'rgba(239,68,68,0.15)', icon: '🚨', filter: 'critical' },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={() => setFilter(stat.filter)}
              style={{
                backgroundColor: '#0f172a',
                border: `1px solid ${filter === stat.filter ? stat.color + '40' : '#1e293b'}`,
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                backgroundImage: `radial-gradient(ellipse at top, ${stat.glow} 0%, transparent 70%)`,
                transition: 'all 0.2s',
                boxShadow: filter === stat.filter ? `0 0 20px ${stat.color}20` : 'none'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Ward Scorecard */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700 }}>Ward Accountability Scorecard</h2>
              <p style={{ color: '#475569', fontSize: '13px', marginTop: '2px' }}>Resolution rate by ward — F grade wards are publicly flagged</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { grade: 'A', color: '#22c55e' },
                { grade: 'B', color: '#84cc16' },
                { grade: 'C', color: '#eab308' },
                { grade: 'D', color: '#f97316' },
                { grade: 'F', color: '#ef4444' },
              ].map(g => (
                <div key={g.grade} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: g.color + '20', border: `1px solid ${g.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: g.color }}>
                  {g.grade}
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={wardData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
              <YAxis type="category" dataKey="ward" tick={{ fontSize: 12, fill: '#94a3b8' }} width={85} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {wardData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Grade cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '20px' }}>
            {wardData.slice(0, 5).map((w, i) => (
              <div key={i} style={{
                backgroundColor: w.color + '10',
                border: `1px solid ${w.color}30`,
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: w.color }}>{w.grade}</div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{w.ward}</div>
                <div style={{ color: '#475569', fontSize: '11px' }}>{w.rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports Feed */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700 }}>
              Reports
              <span style={{ color: '#334155', fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>({filteredReports.length})</span>
            </h2>
          </div>

          {filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: '#475569' }}>No reports found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredReports.map((report, i) => {
                const sev = severityColor[report.analysis?.severity] || { bg: '#1e293b', text: '#94a3b8', border: '#334155' }
                const sta = statusColor[report.status] || { bg: '#1e293b', text: '#94a3b8', border: '#334155' }
                const esc = escalationLabel[report.escalationLevel] || escalationLabel[0]

                return (
                  <div key={i} style={{
                    backgroundColor: '#0a0f1a',
                    border: '1px solid #1e293b',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'border-color 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '15px' }}>
                          {report.analysis?.issue_type || 'Unknown Issue'}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                          {report.analysis?.severity}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: sta.bg, color: sta.text, border: `1px solid ${sta.border}` }}>
                          {report.status}
                        </span>
                      </div>
                      <p style={{ color: '#475569', fontSize: '13px', marginBottom: '4px' }}>
                        📍 {report.location?.ward} — {report.location?.address}
                      </p>
                      <p style={{ color: '#334155', fontSize: '12px' }}>
                        {report.analysis?.authority} · {report.id}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: esc.color + '15', color: esc.color, fontSize: '11px', fontWeight: 600, border: `1px solid ${esc.color}30` }}>
                        {esc.label}
                      </div>
                      <button
                      onClick={() => toggleResolved(report.docId, report.status)}
                      style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: report.status === 'Resolved' ? '#0c1a3a' : '#052e16',
                      color: report.status === 'Resolved' ? '#3b82f6' : '#22c55e',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: `1px solid ${report.status === 'Resolved' ? '#1e3a8a' : '#166534'}`,
                      cursor: 'pointer'
                    }}
>
  {report.status === 'Resolved' ? 'Undo Resolved' : 'Mark Resolved'}
</button>
                      <p style={{ color: '#334155', fontSize: '11px' }}>
                        {report.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || 'Just now'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}