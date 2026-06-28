import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { analyzeIssueImage } from '../agents/visionAgent'
import { investigateIssue } from '../agents/reasoningAgent'
import { generateComplaint } from '../agents/complaintAgent'

const WARDS = [
  'Koramangala', 'Indiranagar', 'Whitefield',
  'Jayanagar', 'Hebbal', 'Rajajinagar',
  'Marathahalli', 'BTM Layout', 'Yelahanka', 'Malleswaram'
]

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

const steps = [
  { id: 1, label: 'Vision Analysis', icon: '🔍', desc: 'AI analyzing photo...' },
  { id: 2, label: 'Hotspot Check', icon: '🗺️', desc: 'Checking ward patterns...' },
  { id: 3, label: 'Drafting Complaint', icon: '📝', desc: 'Generating formal letter...' },
  { id: 4, label: 'Filing Report', icon: '💾', desc: 'Saving to database...' },
]

const severityConfig = {
  Low: { color: '#22c55e', bg: '#052e16', border: '#166534' },
  Medium: { color: '#eab308', bg: '#1c1500', border: '#854d0e' },
  High: { color: '#f97316', bg: '#1c0a00', border: '#9a3412' },
  Critical: { color: '#ef4444', bg: '#1c0000', border: '#991b1b' }
}

export default function ReportPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [ward, setWard] = useState('')
  const [address, setAddress] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [activeAgentStep, setActiveAgentStep] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [investigation, setInvestigation] = useState(null)
  const [complaint, setComplaint] = useState(null)
  const [reportId, setReportId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showPortalGuide, setShowPortalGuide] = useState(false)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!image || !ward) { setError('Please upload a photo and select a ward.'); return }
    setError(null)
    setLoading(true)
    setCurrentStep(1)

    const id = `NN-${Date.now()}`
    setReportId(id)
    const location = { ward, address: address || ward, zone: 'South Zone', ...WARD_COORDS[ward] }

    try {
      setActiveAgentStep(1)
const analysisResult = await analyzeIssueImage(image)

if (
  analysisResult.issue_type === 'Not a civic issue' ||
  analysisResult.issue_type === 'Not Applicable' ||
  (analysisResult.category === 'Other' && analysisResult.confidence < 0.5)
) {
  setError('⚠️ This image does not appear to show a civic issue. Please upload a clear photo of a pothole, water leakage, broken streetlight, or similar problem.')
  setLoading(false)
  setCurrentStep(0)
  setActiveAgentStep(0)
  return
}

setAnalysis(analysisResult)

      setActiveAgentStep(2)
      const investigationResult = await investigateIssue(analysisResult, location)
      setInvestigation(investigationResult)

      setActiveAgentStep(3)
      const complaintText = await generateComplaint(analysisResult, location, id, investigationResult.startEscalationLevel)
      setComplaint(complaintText)

      setActiveAgentStep(4)
      await addDoc(collection(db, 'reports'), {
        id, location, analysis: analysisResult,
        investigation: investigationResult,
        complaint: complaintText,
        status: 'Reported',
        escalationLevel: investigationResult.startEscalationLevel,
        createdAt: serverTimestamp(),
        lastEscalatedAt: serverTimestamp(),
        resolvedAt: null
      })

      setCurrentStep(2)
      setLoading(false)
    } catch (err) {
      setError('Something went wrong: ' + err.message)
      setLoading(false)
      setCurrentStep(0)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(complaint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setCurrentStep(0); setImage(null); setPreview(null)
    setWard(''); setAddress(''); setAnalysis(null)
    setInvestigation(null); setComplaint(null)
    setActiveAgentStep(0)
  }

  const sev = analysis ? severityConfig[analysis.severity] : null

  return (
    <div style={{ backgroundColor: '#0a0f1a', minHeight: '100vh', padding: '32px 24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes agentPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .file-input:hover { border-color: #334155 !important; background-color: #0f172a !important; }
        select option { background: #0f172a; color: #f1f5f9; }
      `}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.15em', fontWeight: 600, marginBottom: '6px' }}>CIVIC INTELLIGENCE AGENT</p>
          <h1 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 700 }}>Report an Issue</h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px' }}>Upload a photo - the agent handles the rest.</p>
        </div>

        {/* Step 0 — Input Form */}
        {currentStep === 0 && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Photo Upload */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '14px' }}>
                📸 PHOTO EVIDENCE
              </label>
              <label
                className="file-input"
                style={{
                  display: 'block', border: '2px dashed #1e293b', borderRadius: '12px',
                  padding: '32px', textAlign: 'center', cursor: 'pointer',
                  backgroundColor: '#0a0f1a', transition: 'all 0.2s'
                }}
              >
                <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                {!preview ? (
                  <>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                    <p style={{ color: '#475569', fontSize: '14px' }}>Click to upload photo</p>
                    <p style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>JPG, PNG, WEBP supported</p>
                  </>
                ) : (
                  <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
              </label>
              {preview && (
                <button onClick={() => { setImage(null); setPreview(null) }} style={{ marginTop: '8px', color: '#475569', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Remove photo
                </button>
              )}
            </div>

            {/* Location */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '14px' }}>
                📍 LOCATION
              </label>
              <select
                value={ward}
                onChange={e => setWard(e.target.value)}
                style={{
                  width: '100%', backgroundColor: '#0a0f1a', border: '1px solid #1e293b',
                  borderRadius: '10px', padding: '12px 16px', color: ward ? '#f1f5f9' : '#475569',
                  fontSize: '14px', marginBottom: '12px', outline: 'none'
                }}
              >
                <option value="">Select ward</option>
                {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <input
                type="text"
                placeholder="Street address or landmark (optional)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{
                  width: '100%', backgroundColor: '#0a0f1a', border: '1px solid #1e293b',
                  borderRadius: '10px', padding: '12px 16px', color: '#f1f5f9',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: '#1c0000', border: '1px solid #991b1b', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!image || !ward}
              style={{
                width: '100%', backgroundColor: !image || !ward ? '#1e293b' : '#3b82f6',
                color: !image || !ward ? '#475569' : 'white',
                padding: '16px', borderRadius: '14px', fontWeight: 700,
                fontSize: '15px', border: 'none', cursor: !image || !ward ? 'not-allowed' : 'pointer',
                boxShadow: !image || !ward ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
                transition: 'all 0.2s'
              }}
            >
              Analyze & File Report →
            </button>
          </div>
        )}

        {/* Step 1 — Agent Working */}
        {currentStep === 1 && loading && (
          <div className="fade-up" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '32px' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Agent is working</h3>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '32px' }}>Running {steps.length} intelligence steps...</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {steps.map((step, i) => {
                const isDone = activeAgentStep > step.id
                const isActive = activeAgentStep === step.id
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                      backgroundColor: isDone ? '#052e16' : isActive ? '#0c1a3a' : '#0a0f1a',
                      border: `1px solid ${isDone ? '#166534' : isActive ? '#1e3a8a' : '#1e293b'}`,
                      animation: isActive ? 'agentPulse 1.5s infinite' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {isDone ? '✓' : isActive ? (
                        <div style={{ width: '18px', height: '18px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      ) : step.icon}
                    </div>
                    <div>
                      <p style={{ color: isDone ? '#22c55e' : isActive ? '#f1f5f9' : '#334155', fontSize: '14px', fontWeight: 600, transition: 'color 0.3s' }}>
                        {step.label}
                      </p>
                      <p style={{ color: '#334155', fontSize: '12px', marginTop: '2px' }}>
                        {isDone ? 'Complete' : isActive ? step.desc : 'Waiting...'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Results */}
        {currentStep === 2 && analysis && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Report filed badge */}
            <div style={{ backgroundColor: '#052e16', border: '1px solid #166534', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#475569', fontSize: '12px' }}>Complaint Ready for Submission</p>
                <p style={{ color: '#22c55e', fontWeight: 700, fontSize: '16px' }}>{reportId}</p>
              </div>
              <span style={{ fontSize: '28px' }}>✅</span>
            </div>

            {/* AI Analysis */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
              <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '16px' }}>🤖 AI ANALYSIS</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700 }}>{analysis.issue_type}</span>
                {sev && (
                  <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                    {analysis.severity}
                  </span>
                )}
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>{analysis.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Authority', value: analysis.authority },
                  { label: 'Affected', value: analysis.estimated_affected },
                  { label: 'Category', value: analysis.category },
                  { label: 'Confidence', value: `${(analysis.confidence * 100).toFixed(0)}%` },
                ].map((item, i) => (
                  <div key={i} style={{ backgroundColor: '#0a0f1a', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px 14px' }}>
                    <p style={{ color: '#334155', fontSize: '11px', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600 }}>{item.value}</p>
                  </div>
                ))}
              </div>
              {analysis.immediate_risk && (
                <div style={{ marginTop: '12px', backgroundColor: '#1c0000', border: '1px solid #991b1b', borderRadius: '10px', padding: '10px 14px' }}>
                  <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>⚠️ Immediate risk — escalation recommended</p>
                </div>
              )}
            </div>

            {/* Hotspot */}
            {investigation && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
                <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '12px' }}>🗺️ HOTSPOT ANALYSIS</p>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{investigation.insight}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  {[
                    { value: investigation.nearbyCount, label: 'Similar Issues', color: '#f97316' },
                    { value: investigation.wardTotal, label: 'Ward Open Issues', color: '#ef4444' },
                    { value: investigation.priority, label: 'Priority', color: '#3b82f6' },
                  ].map((item, i) => (
                    <div key={i} style={{ backgroundColor: '#0a0f1a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                      <p style={{ color: item.color, fontSize: '22px', fontWeight: 800 }}>{item.value}</p>
                      <p style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complaint */}
{complaint && (
  <div style={{
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '24px'
  }}>

    <p style={{
      color: '#475569',
      fontSize: '12px',
      letterSpacing: '0.1em',
      fontWeight: 600,
      marginBottom: '16px'
    }}>
      📝 COMPLAINT READY FOR SUBMISSION
    </p>

    {/* Action Buttons */}

    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '18px'
    }}>

      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          backgroundColor: copied ? '#052e16' : '#0c1a3a',
          color: copied ? '#22c55e' : '#3b82f6',
          border: `1px solid ${copied ? '#166534' : '#1e3a8a'}`,
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        {copied ? '✓ Copied' : '📋 Copy Complaint'}
      </button>

      <button
        onClick={() => {
          window.open('https://bbmp.gov.in/', '_blank')
          setShowPortalGuide(true)
        }}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          backgroundColor: '#1a0f00',
          color: '#f59e0b',
          border: '1px solid #854d0e',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        🌐 Open BBMP Sahaaya 2.0
      </button>

      <button
        onClick={() => window.open('tel:1533')}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          backgroundColor: '#0a0f1a',
          color: '#94a3b8',
          border: '1px solid #1e293b',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        📞 Call BBMP Helpline (1533)
      </button>

    </div>

    <pre
      style={{
        color: '#64748b',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'inherit',
        backgroundColor: '#0a0f1a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '16px',
        maxHeight: '240px',
        overflowY: 'auto',
        lineHeight: 1.6
      }}
    >
      {complaint}
    </pre>

    {showPortalGuide && (
      <div
        style={{
          marginTop: '18px',
          backgroundColor: '#0a0f1a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '16px'
        }}
      >
        <p style={{
          color: '#22c55e',
          fontWeight: 600,
          marginBottom: '12px'
        }}>
          ✅ BBMP website opened in a new tab.
          Follow the steps below to submit your complaint.
        </p>

        <p style={{
          color: '#94a3b8',
          fontWeight: 600,
          marginBottom: '10px'
        }}>
          How to file:
        </p>

        <ol style={{
          color: '#64748b',
          paddingLeft: '20px',
          lineHeight: 1.8
        }}>
          <li>1.Open the BBMP website.</li>
          <li>2.Click <b>SAHAAYA 2.0 (Public Grievance) under services</b>.</li>
          <li>3.Login or Register.</li>
          <li>4.Select BBMP (Sahaaya 2.0).</li>
          <li>5.Click <b>Create</b>.</li>
          <li>6.Enter the details.</li>
          <li>7.Paste the generated complaint for description.</li>
          <li>8.Upload the same image and choose location.</li>
          <li>9.Submit your complaint.</li>
        </ol>
      </div>
    )}

  </div>
)}

            {/* Escalation Timeline */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
              <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '20px' }}>🔁 ESCALATION TIMELINE</p>
              {[
                { day: 'Day 0', label: 'Ward Officer', color: '#3b82f6', active: true },
                { day: 'Day 7', label: 'Zonal Commissioner', color: '#f59e0b', active: investigation?.startEscalationLevel >= 1 },
                { day: 'Day 14', label: 'BBMP Commissioner', color: '#f97316', active: false },
                { day: 'Day 21', label: 'Public Dashboard', color: '#ef4444', active: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    backgroundColor: item.active ? item.color + '20' : '#0a0f1a',
                    border: `2px solid ${item.active ? item.color : '#1e293b'}`,
                    color: item.active ? item.color : '#334155',
                    boxShadow: item.active ? `0 0 12px ${item.color}40` : 'none'
                  }}>
                    {item.active ? '✓' : i + 1}
                  </div>
                  <div>
                    <p style={{ color: item.active ? '#f1f5f9' : '#334155', fontSize: '14px', fontWeight: 500 }}>{item.label}</p>
                    <p style={{ color: '#334155', fontSize: '12px' }}>{item.day}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={reset}
              style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #1e293b', color: '#475569', padding: '14px', borderRadius: '14px', fontSize: '14px', cursor: 'pointer' }}
            >
              Report Another Issue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}