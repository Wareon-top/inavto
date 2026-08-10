/* Личный кабинет клиента: доступ по секретной ссылке, без логина и пароля.
   Одна ссылка показывает ВСЕ заказы клиента (сделки с тем же телефоном).
   Наружу уходит только безопасное подмножество: без телефона и заметок
   о клиенте, без закупочной цены в юанях, без внутренней логистики
   и служебных комментариев. */
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import db from '../db.js'
import { UPLOAD_DIR } from './upload.js'

const router = Router()

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

/* События, которые видит клиент: смены статуса, фотоотчёты
   и адресованные ему сообщения. Служебные комментарии не отдаём. */
const CLIENT_EVENTS = new Set(['status', 'photos', 'client_msg'])

/* Если в сделке ещё нет фото — берём фото этой модели из каталога сайта */
function catalogPhoto(car) {
  const c = String(car || '').trim().toLowerCase()
  if (!c) return null
  const rows = db.prepare('SELECT name, photos FROM site_cars WHERE hidden = 0').all()
  for (const r of rows) {
    const n = String(r.name || '').trim().toLowerCase()
    if (!n) continue
    if (c.includes(n) || n.includes(c)) {
      const ph = JSON.parse(r.photos || '[]')
      if (ph.length) return ph[0]
    }
  }
  return null
}

const clientOrder = (r, token) => {
  const log = JSON.parse(r.log || '[]')
  const photos = JSON.parse(r.photos || '[]')
  const docs = db.prepare(`
    SELECT id, name, url, size, ext, created_at FROM docs
    WHERE deal_id = ? AND client_visible = 1
    ORDER BY created_at DESC, id DESC
  `).all(r.id).map((doc) => ({ ...doc, url: `/api/lk/${token}/docs/${doc.id}` }))
  return {
    order: 'IA-' + r.id,
    car: r.car,
    trim: r.trim,
    vin: r.vin,
    color: r.color,
    year: r.year,
    status: r.status,
    from_city: r.from_city,
    to_city: r.to_city,
    ship_date: r.ship_date,
    eta: r.eta,
    created_at: r.created_at,
    updated_at: r.updated_at,
    photos,
    fallback_photo: photos.length ? null : catalogPhoto(r.car),
    docs,
    events: log
      .filter((e) => CLIENT_EVENTS.has(e.type))
      /* у событий «смена статуса» текст — служебный комментарий, клиенту не отдаём */
      .map(({ ts, type, text, status }) => (type === 'status' ? { ts, type, status } : { ts, type, text, status })),
  }
}

router.get('/:token/docs/:id', (req, res) => {
  const t = String(req.params.token || '')
  if (!TOKEN_RE.test(t)) return res.status(404).json({ error: 'Не найдено' })
  const owner = db.prepare('SELECT id, client_phone FROM deals WHERE client_token = ?').get(t)
  if (!owner) return res.status(404).json({ error: 'Не найдено' })
  const doc = db.prepare(`
    SELECT d.*, deals.client_phone FROM docs d
    JOIN deals ON deals.id = d.deal_id
    WHERE d.id = ? AND d.client_visible = 1
  `).get(req.params.id)
  const belongs = doc && (doc.deal_id === owner.id || (owner.client_phone && doc.client_phone === owner.client_phone))
  if (!belongs) return res.status(404).json({ error: 'Не найдено' })
  const file = path.join(UPLOAD_DIR, 'docs', path.basename(doc.url))
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Файл не найден' })
  res.download(file, doc.name)
})

router.get('/:token', (req, res) => {
  const t = String(req.params.token || '')
  if (!TOKEN_RE.test(t)) return res.status(404).json({ error: 'Не найдено' })
  const row = db.prepare('SELECT * FROM deals WHERE client_token = ?').get(t)
  if (!row) return res.status(404).json({ error: 'Не найдено' })

  /* Все заказы этого клиента: по совпадению телефона (если он указан) */
  const rows = row.client_phone
    ? db.prepare('SELECT * FROM deals WHERE client_phone = ? ORDER BY updated_at DESC, id DESC').all(row.client_phone)
    : [row]

  res.json({
    ok: true,
    client: { name: row.client_name },
    orders: rows.map((order) => clientOrder(order, t)),
  })
})

export default router
