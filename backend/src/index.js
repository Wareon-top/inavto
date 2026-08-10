import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { initBot } from './bot.js'
import carsRouter from './routes/cars.js'
import selectionsRouter from './routes/selections.js'
import ordersRouter from './routes/orders.js'
import siteCarsRouter from './routes/siteCars.js'
import dealsRouter from './routes/deals.js'
import docsRouter from './routes/docs.js'
import lkRouter from './routes/lk.js'
import uploadRouter, { UPLOAD_DIR } from './routes/upload.js'
import { rebuildSitePages } from './sitegen.js'
import { adminOnly, staffOnly } from './auth.js'
import {
  apiLimiter,
  clientCabinetLimiter,
  corsMiddleware,
  leadLimiter,
  securityHeaders,
} from './security.js'

export const app = express()
const PORT = process.env.PORT || 3000
const ROOT = path.dirname(fileURLToPath(import.meta.url))

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(securityHeaders)
app.use(corsMiddleware())
app.use('/api', apiLimiter)

const smallJson = express.json({ limit: '256kb' })
/* Документы (PDF/сканы) идут base64: файл до 50 МБ превращается в ~67 МБ JSON. */
const largeJson = express.json({ limit: '80mb' })

app.use('/api/cars', smallJson, carsRouter)
app.use('/api/selections', leadLimiter, smallJson, selectionsRouter)
app.use('/api/orders', adminOnly, smallJson, ordersRouter)
app.use('/api/site-cars', smallJson, siteCarsRouter)
app.use('/api/deals', staffOnly, largeJson, dealsRouter)
app.use('/api/docs', staffOnly, largeJson, docsRouter)
app.use('/api/lk', clientCabinetLimiter, lkRouter)
app.use('/api/upload', adminOnly, largeJson, uploadRouter)

/* Админка, личный кабинет клиента и загруженные фото.
   HTML отдаём с no-cache: браузер каждый раз сверяется с сервером (304,
   если не менялось) — после обновления не нужно чистить кэш. */
app.use('/uploads/docs', (_, res) => res.status(404).json({ error: 'Not found' }))
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))
app.get('/admin', (_, res) => {
  res.set('Cache-Control', 'no-cache')
  res.sendFile(path.join(ROOT, '../public/admin.html'))
})
app.get('/lk', (_, res) => {
  res.set('Cache-Control', 'no-cache')
  res.sendFile(path.join(ROOT, '../public/lk.html'))
})

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' })
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  console.error('[INAVTO] Unhandled request error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

export function start() {
  initBot()
  return app.listen(PORT, () => {
    console.log(`[INAVTO] Backend running on http://localhost:${PORT}`)
    /* Страницы машин для поисковиков: выкладка сайта (rsync) их затирает,
       поэтому восстанавливаем их при каждом старте службы. */
    rebuildSitePages()
      .then((r) => console.log(r.ok
        ? `[INAVTO] Страницы каталога: ${r.total} (обновлено ${r.written}, удалено ${r.removed})`
        : `[INAVTO] Страницы каталога не пересобраны: ${r.reason}`))
      .catch((e) => console.error('[INAVTO] Ошибка генерации страниц:', e.message))
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) start()
