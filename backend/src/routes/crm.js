import { Router } from 'express'
import db from '../db.js'

const router = Router()

export const REQUEST_STATUSES = [
  { id: 'new', label: 'Новая', tone: 'blue' },
  { id: 'working', label: 'В работе', tone: 'amber' },
  { id: 'found', label: 'Найдено', tone: 'green' },
  { id: 'closed', label: 'Закрыта', tone: 'gray' },
]

const statusIds = new Set(REQUEST_STATUSES.map((item) => item.id))
const conditions = new Set(['new', 'used'])
const noteColors = new Set(['yellow', 'blue', 'green', 'pink', 'violet'])
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max)

function requestPayload(body) {
  const status = clean(body?.status, 24) || 'new'
  const condition = clean(body?.condition, 24) || 'new'
  const rawYear = Number(body?.year)
  return {
    request_date: clean(body?.request_date, 10),
    brand: clean(body?.brand, 180),
    condition: conditions.has(condition) ? condition : 'new',
    year: Number.isInteger(rawYear) && rawYear >= 1900 && rawYear <= 2100 ? rawYear : null,
    color: clean(body?.color, 80),
    available: body?.available === true || body?.available === 1 || body?.available === '1' ? 1 : 0,
    status: statusIds.has(status) ? status : 'new',
    note: clean(body?.note, 4000),
    note_color: noteColors.has(body?.note_color) ? body.note_color : 'yellow',
  }
}

function validateRequest(item, res) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.request_date)) {
    res.status(400).json({ error: 'Укажите дату заявки' })
    return false
  }
  if (!item.brand) {
    res.status(400).json({ error: 'Укажите марку автомобиля' })
    return false
  }
  if (!item.year) {
    res.status(400).json({ error: 'Укажите корректный год автомобиля' })
    return false
  }
  return true
}

function getRequest(id) {
  return db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM crm_request_attachments a WHERE a.request_id = r.id AND a.kind = 'photo') AS photo_count,
      (SELECT COUNT(*) FROM crm_request_attachments a WHERE a.request_id = r.id AND a.kind = 'video') AS video_count
    FROM crm_requests r WHERE r.id = ?
  `).get(id)
}

router.get('/statuses', (_req, res) => res.json(REQUEST_STATUSES))

router.get('/requests', (req, res) => {
  const q = clean(req.query.q, 120)
  const archive = req.query.archive === '1'
  const params = []
  const where = [archive ? "r.status = 'closed'" : "r.status != 'closed'"]
  if (q) {
    where.push('(r.brand LIKE ? OR r.color LIKE ? OR r.note LIKE ?)')
    params.push(...Array(3).fill(`%${q}%`))
  }
  const items = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM crm_request_attachments a WHERE a.request_id = r.id AND a.kind = 'photo') AS photo_count,
      (SELECT COUNT(*) FROM crm_request_attachments a WHERE a.request_id = r.id AND a.kind = 'video') AS video_count
    FROM crm_requests r
    WHERE ${where.join(' AND ')}
    ORDER BY r.request_date DESC, r.id DESC
  `).all(...params)
  res.json(items)
})

router.get('/requests/:id', (req, res) => {
  const item = getRequest(req.params.id)
  if (!item) return res.status(404).json({ error: 'Заявка не найдена' })
  res.json(item)
})

router.post('/requests', (req, res) => {
  const item = requestPayload(req.body)
  if (!validateRequest(item, res)) return
  const result = db.prepare(`
    INSERT INTO crm_requests (
      request_date, brand, condition, year, color, available, status, note, note_color, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    item.request_date, item.brand, item.condition, item.year, item.color,
    item.available, item.status, item.note, item.note_color,
  )
  res.status(201).json(getRequest(result.lastInsertRowid))
})

router.put('/requests/:id', (req, res) => {
  if (!getRequest(req.params.id)) return res.status(404).json({ error: 'Заявка не найдена' })
  const item = requestPayload(req.body)
  if (!validateRequest(item, res)) return
  db.prepare(`
    UPDATE crm_requests SET
      request_date = ?, brand = ?, condition = ?, year = ?, color = ?, available = ?,
      status = ?, note = ?, note_color = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    item.request_date, item.brand, item.condition, item.year, item.color,
    item.available, item.status, item.note, item.note_color, req.params.id,
  )
  res.json(getRequest(req.params.id))
})

router.delete('/requests/:id', (req, res) => {
  const remove = db.transaction((id) => {
    db.prepare('DELETE FROM crm_request_attachments WHERE request_id = ?').run(id)
    return db.prepare('DELETE FROM crm_requests WHERE id = ?').run(id)
  })
  const result = remove(req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'Заявка не найдена' })
  res.json({ ok: true })
})

router.get('/requests/:id/attachments', (req, res) => {
  if (!getRequest(req.params.id)) return res.status(404).json({ error: 'Заявка не найдена' })
  const items = db.prepare(`
    SELECT id, request_id, kind, filename, mime_type, size, data_url, created_at
    FROM crm_request_attachments WHERE request_id = ? ORDER BY id ASC
  `).all(req.params.id)
  res.json(items)
})

router.post('/requests/:id/attachments', (req, res) => {
  if (!getRequest(req.params.id)) return res.status(404).json({ error: 'Заявка не найдена' })
  const kind = req.body?.kind === 'video' ? 'video' : req.body?.kind === 'photo' ? 'photo' : ''
  const filename = clean(req.body?.filename, 240)
  const mimeType = clean(req.body?.mime_type, 100)
  const dataUrl = String(req.body?.data_url ?? '')
  const expectedPrefix = kind === 'photo' ? 'data:image/' : 'data:video/'
  if (!kind || !filename || !mimeType || !dataUrl.startsWith(expectedPrefix)) {
    return res.status(400).json({ error: 'Некорректное вложение' })
  }
  const comma = dataUrl.indexOf(',')
  const encoded = comma >= 0 ? dataUrl.slice(comma + 1) : ''
  const size = Math.floor(encoded.length * 0.75)
  const limit = kind === 'photo' ? 12 * 1024 * 1024 : 50 * 1024 * 1024
  if (!encoded || size > limit) {
    return res.status(413).json({ error: kind === 'photo' ? 'Фото больше 12 МБ' : 'Видео больше 50 МБ' })
  }
  const result = db.prepare(`
    INSERT INTO crm_request_attachments (request_id, kind, filename, mime_type, size, data_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, kind, filename, mimeType, size, dataUrl)
  db.prepare("UPDATE crm_requests SET updated_at = datetime('now') WHERE id = ?").run(req.params.id)
  res.status(201).json({ id: result.lastInsertRowid, ok: true })
})

router.delete('/attachments/:id', (req, res) => {
  const result = db.prepare('DELETE FROM crm_request_attachments WHERE id = ?').run(req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'Вложение не найдено' })
  res.json({ ok: true })
})

export default router
