const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
  })
}

export const analyzeIssueImage = async (imageFile) => {
  const base64Image = await fileToBase64(imageFile)
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a civic infrastructure assessment agent for Bengaluru, India.
Analyze this image and return ONLY a valid JSON object. No markdown, no backticks, no explanation. Just raw JSON.

{
  "issue_type": "specific problem (e.g. Pothole, Water Leakage, Broken Streetlight, Garbage Overflow, Damaged Footpath)",
  "severity": "Low or Medium or High or Critical",
  "category": "Road or Water or Electricity or Waste or Other",
  "authority": "BBMP for roads/footpaths/waste, BWSSB for water, BESCOM for electricity",
  "description": "2-3 sentence assessment written like a field inspector",
  "confidence": 0.94,
  "immediate_risk": true,
  "estimated_affected": "50-100 residents"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      temperature: 0.1
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'API call failed')
  }

  const text = data.choices[0].message.content
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}