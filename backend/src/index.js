import 'dotenv/config'
import express from 'express'
import cors from 'cors'
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

const app = express()
const PORT = process.env.PORT || 3000
const ROOT = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
/* 80mb: документы (PDF/сканы) идут base64 — файл до 50 МБ превращается в ~67 МБ JSON */
app.use(express.json({ limit: '80mb' }))

app.use('/api/cars', carsRouter)
app.use('/api/selections', selectionsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/site-cars', siteCarsRouter)
app.use('/api/deals', dealsRouter)
app.use('/api/docs', docsRouter)
app.use('/api/lk', lkRouter)
app.use('/api/upload', uploadRouter)

/* Админка, личный кабинет клиента и загруженные фото.
   HTML отдаём с no-cache: браузер каждый раз сверяется с сервером (304,
   если не менялось) — после обновления не нужно чистить кэш. */
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

initBot()

app.listen(PORT, () => {
  console.log(`[INAVTO] Backend running on http://localhost:${PORT}`)
  /* Страницы машин для поисковиков: выкладка сайта (rsync) их затирает,
     поэтому восстанавливаем их при каждом старте службы. */
  rebuildSitePages()
    .then((r) => console.log(r.ok
      ? `[INAVTO] Страницы каталога: ${r.total} (обновлено ${r.written}, удалено ${r.removed})`
      : `[INAVTO] Страницы каталога не пересобраны: ${r.reason}`))
    .catch((e) => console.error('[INAVTO] Ошибка генерации страниц:', e.message))
})
