import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initBot } from './bot.js'
import carsRouter from './routes/cars.js'
import selectionsRouter from './routes/selections.js'
import ordersRouter from './routes/orders.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/cars', carsRouter)
app.use('/api/selections', selectionsRouter)
app.use('/api/orders', ordersRouter)

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

initBot()

app.listen(PORT, () => {
  console.log(`[INAVTO] Backend running on http://localhost:${PORT}`)
})
