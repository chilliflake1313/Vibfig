import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

console.log('Groq API Key loaded: - index.js:16', !!process.env.GROQ_API_KEY)

const PROMPT = `You are an AI that generates structured project architectures. Given a project idea, return a JSON object with the following exact structure:
{
  "label": "the main idea",
  "children": [
    {
      "label": "Module Name",
      "children": [
        { "label": "Setup" },
        { "label": "Optimize" }
      ]
    }
  ]
}

Generate 6-8 relevant modules for the project. Common modules: Auth, Database, API, Frontend, Realtime, Deployment, Cache, Queue, Search, Monitoring, Testing, CI/CD.
Return ONLY valid JSON, no markdown or extra text.`

app.post('/generate', async (req, res) => {
  try {
    const { idea } = req.body

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ error: 'idea required' })
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `${PROMPT}\n\nProject idea: ${idea}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 1024
    })

    const content = chatCompletion.choices[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Invalid JSON in response')
    }

    const response = JSON.parse(jsonMatch[0])
    res.json(response)

  } catch (error) {
    console.error('Generate error: - index.js:65', error.message)
    res.status(500).json({ error: error.message || 'Generation failed' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} - index.js:72`)
})
