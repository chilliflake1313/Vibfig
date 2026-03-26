import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const modules = ['Auth', 'Database', 'API', 'Frontend', 'Realtime', 'Deployment', 'Cache', 'Queue', 'Search']

const randomModules = () => {
  const shuffled = [...modules].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 6 + Math.floor(Math.random() * 3))
}

app.post('/generate', (req, res) => {
  try {
    const { idea } = req.body

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ error: 'idea required' })
    }

    const selectedModules = randomModules()
    const children = selectedModules.map(label => ({
      label,
      children: [
        { label: 'Setup' },
        { label: 'Optimize' }
      ]
    }))

    const response = {
      label: idea || 'Architecture',
      children
    }

    res.json(response)

  } catch (error) {
    console.error('Generate error:', error.message)
    res.status(500).json({ error: 'Generation failed' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
