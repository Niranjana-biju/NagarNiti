import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export const investigateIssue = async (analysis, location) => {
  // Check for nearby reports in Firestore
  const reportsRef = collection(db, 'reports')
  const q = query(reportsRef, where('location.ward', '==', location.ward))
  const snapshot = await getDocs(q)

  const wardReports = snapshot.docs.map(doc => doc.data())
  const unresolvedInWard = wardReports.filter(r => r.status !== 'Resolved')
  const sameCategory = unresolvedInWard.filter(r => r.analysis?.category === analysis.category)

  // Determine if hotspot
  const isHotspot = sameCategory.length >= 3
  const isRecurring = sameCategory.length >= 1

  // Calculate priority score
  const severityScore = { Low: 1, Medium: 2, High: 3, Critical: 4 }
  const baseScore = severityScore[analysis.severity] || 1
  const hotspotBonus = isHotspot ? 2 : isRecurring ? 1 : 0
  const riskBonus = analysis.immediate_risk ? 1 : 0
  const totalScore = baseScore + hotspotBonus + riskBonus

  const priority = totalScore >= 6 ? 'Critical' :
                   totalScore >= 4 ? 'High' :
                   totalScore >= 2 ? 'Medium' : 'Low'

  // Determine escalation start level
  const startEscalationLevel = isHotspot ? 1 : 0

  return {
    isHotspot,
    isRecurring,
    nearbyCount: sameCategory.length,
    wardTotal: unresolvedInWard.length,
    priority,
    startEscalationLevel,
    insight: isHotspot
      ? `⚠️ Hotspot detected — ${sameCategory.length} similar unresolved ${analysis.category} issues in ${location.ward}. Priority upgraded. Escalating directly to Zonal Commissioner.`
      : isRecurring
      ? `🔁 Recurring issue — ${sameCategory.length} similar report(s) found in ${location.ward}. Priority elevated.`
      : `🆕 New incident logged in ${location.ward}.`
  }
}