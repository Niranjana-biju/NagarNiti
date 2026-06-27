export const generateComplaint = async (analysis, location, reportId, escalationLevel = 0) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  const escalationContext = {
    0: {
      addressee: `The Ward Officer\nBBMP Ward — ${location.ward}`,
      urgency: 'standard',
      opening: 'I am writing to formally report a civic infrastructure issue',
      closing: 'Immediate intervention is requested within 7 days, failing which this complaint will be escalated to the Zonal Commissioner.'
    },
    1: {
      addressee: `The Zonal Commissioner\nBBMP — ${location.zone || 'South Zone'}`,
      urgency: 'elevated',
      opening: 'I am writing to escalate a previously reported civic issue that has received no response from the Ward Officer',
      closing: 'Resolution is requested within 7 days, failing which this will be escalated to the BBMP Commissioner.'
    },
    2: {
      addressee: `The Commissioner\nBruhat Bengaluru Mahanagara Palike (BBMP)`,
      urgency: 'critical',
      opening: 'I am writing to formally escalate a civic issue that has been ignored at both Ward Officer and Zonal Commissioner levels',
      closing: 'This matter requires your immediate personal attention. Further inaction will result in this being made a matter of public record on our ward accountability dashboard.'
    },
    3: {
      addressee: `PUBLIC RECORD\nNagarNiti Ward Accountability Dashboard`,
      urgency: 'public',
      opening: 'This issue has been reported and escalated through all BBMP channels with no resolution',
      closing: 'This ward has been flagged as UNRESPONSIVE on the NagarNiti public dashboard.'
    }
  }

  const ctx = escalationContext[escalationLevel]
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const time = new Date().toLocaleTimeString('en-IN')

  const prompt = `
    You are a civic complaint drafting agent. Generate a formal complaint letter for a civic issue in Bengaluru.
    
    Return ONLY the complaint letter text, no JSON, no explanation.
    
    Details:
    - Issue: ${analysis.issue_type}
    - Severity: ${analysis.severity}
    - Category: ${analysis.category}
    - Authority: ${analysis.authority}
    - Description: ${analysis.description}
    - Location: ${location.address || location.ward}
    - Ward: ${location.ward}
    - Affected: ${analysis.estimated_affected}
    - Immediate Risk: ${analysis.immediate_risk}
    - Report ID: ${reportId}
    - Date: ${date} at ${time}
    - Escalation Level: ${escalationLevel}
    - Addressee: ${ctx.addressee}
    - Opening: ${ctx.opening}
    - Closing: ${ctx.closing}
    - Urgency: ${ctx.urgency}
    
    Write a formal, assertive complaint letter. Include all details.
    Reference the Report ID. Mention the date. Keep it under 300 words.
    Do not include subject line separately — include it in the letter body.
  `

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  })

  const data = await response.json()
  return data.choices[0].message.content
}