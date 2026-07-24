/* Журнал сделок: каждая строка — один автомобиль клиента.
   admin (ADMIN_TOKEN) — полный доступ; staff (STAFF_TOKEN, китайский
   представитель) — видит журнал без контактов клиента и может только
   менять статус, писать комментарии и загружать фото. */
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import db from '../db.js'
import { adminOnly, staffOnly } from '../auth.js'
import { UPLOAD_DIR } from './upload.js'

const router = Router()

export const DEAL_STATUSES = ['search', 'bought', 'export', 'transit', 'customs', 'lab', 'epts', 'done']

/* Поля, которые редактирует админ в карточке */
const FIELDS = [
  'car', 'trim', 'vin', 'color', 'year', 'price_cny',
  'client_name', 'client_phone', 'client_tg', 'client_note',
  'from_city', 'to_city', 'ship_date', 'customs_post', 'carrier', 'container', 'eta', 'rep',
]

const parse = (row) => row && ({
  ...row,
  photos: JSON.parse(row.photos || '[]'),
  log: JSON.parse(row.log || '[]'),
})

/* Представителю не показываем контакты клиента — только имя */
const forRole = (deal, role) => {
  if (!deal || role === 'admin') return deal
  const { client_phone, client_tg, client_note, ...rest } = deal
  return rest
}

const touch = (id) => db.prepare("UPDATE deals SET updated_at = datetime('now') WHERE id = ?").run(id)

export function addLog(id, entry) {
  const row = db.prepare('SELECT log FROM deals WHERE id = ?').get(id)
  const log = JSON.parse(row.log || '[]')
  log.push({ ts: new Date().toISOString(), ...entry })
  db.prepare('UPDATE deals SET log = ? WHERE id = ?').run(JSON.stringify(log), id)
  touch(id)
}

router.get('/whoami', staffOnly, (req, res) => res.json({ role: req.role }))

router.get('/', staffOnly, (req, res) => {
  const items = db.prepare('SELECT * FROM deals ORDER BY updated_at DESC, id DESC').all()
    .map(parse).map((d) => forRole(d, req.role))
  res.json(items)
})

router.get('/:id', staffOnly, (req, res) => {
  const d = parse(db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id))
  if (!d) return res.status(404).json({ error: 'Не найдено' })
  res.json(forRole(d, req.role))
})

router.post('/', adminOnly, (req, res) => {
  const b = req.body || {}
  if (!b.car || !String(b.car).trim()) return res.status(400).json({ error: 'Нужны марка и модель' })
  const status = DEAL_STATUSES.includes(b.status) ? b.status : 'search'
  const info = db.prepare(`
    INSERT INTO deals (car, trim, vin, color, year, price_cny,
      client_name, client_phone, client_tg, client_note, status,
      from_city, to_city, ship_date, customs_post, carrier, container, eta, rep)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(b.car).trim(), b.trim || '', b.vin || '', b.color || '', +b.year || null, +b.price_cny || 0,
    b.client_name || '', b.client_phone || '', b.client_tg || '', b.client_note || '', status,
    b.from_city || '', b.to_city || '', b.ship_date || '', b.customs_post || '', b.carrier || '',
    b.container || '', b.eta || '', b.rep || '',
  )
  addLog(info.lastInsertRowid, { role: 'admin', type: 'created', status })
  res.status(201).json({ id: info.lastInsertRowid, ok: true })
})

router.put('/:id', adminOnly, (req, res) => {
  const cur = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Не найдено' })
  const b = req.body || {}
  const sets = []
  const vals = []
  for (const f of FIELDS) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`)
      vals.push(f === 'year' ? (+b[f] || null) : f === 'price_cny' ? (+b[f] || 0) : String(b[f]))
    }
  }
  if (sets.length) {
    vals.push(req.params.id)
    db.prepare(`UPDATE deals SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  if (b.status !== undefined && DEAL_STATUSES.includes(b.status) && b.status !== cur.status) {
    db.prepare('UPDATE deals SET status = ? WHERE id = ?').run(b.status, req.params.id)
    addLog(req.params.id, { role: 'admin', type: 'status', status: b.status })
  }
  touch(req.params.id)
  res.json({ ok: true })
})

/* Смена статуса — доступна и представителю; комментарий опционален */
router.put('/:id/status', staffOnly, (req, res) => {
  const { status, comment } = req.body || {}
  if (!DEAL_STATUSES.includes(status)) return res.status(400).json({ error: 'Неизвестный статус' })
  const cur = db.prepare('SELECT id FROM deals WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Не найдено' })
  db.prepare('UPDATE deals SET status = ? WHERE id = ?').run(status, req.params.id)
  addLog(req.params.id, { role: req.role, type: 'status', status, text: comment ? String(comment).slice(0, 2000) : undefined })
  res.json({ ok: true })
})

/* Комментарий в журнал — доступен и представителю */
router.post('/:id/comment', staffOnly, (req, res) => {
  const text = String((req.body || {}).text || '').trim()
  if (!text) return res.status(400).json({ error: 'Пустой комментарий' })
  const cur = db.prepare('SELECT id FROM deals WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Не найдено' })
  addLog(req.params.id, { role: req.role, type: 'comment', text: text.slice(0, 2000) })
  res.json({ ok: true })
})

/* Фото (base64 webp/jpeg/png, сжимаются в браузере) — доступно и представителю */
const OK_EXT = { 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png' }
router.post('/:id/photos', staffOnly, (req, res) => {
  const cur = db.prepare('SELECT photos FROM deals WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Не найдено' })
  const items = Array.isArray((req.body || {}).photos) ? req.body.photos : []
  if (!items.length) return res.status(400).json({ error: 'Нет фото' })
  const dir = path.join(UPLOAD_DIR, 'deals', String(req.params.id))
  fs.mkdirSync(dir, { recursive: true })
  const photos = JSON.parse(cur.photos || '[]')
  let added = 0
  for (const p of items.slice(0, 20)) {
    const m = /^data:(image\/(?:webp|jpeg|png));base64,(.+)$/.exec(String(p) || '')
    if (!m) continue
    const buf = Buffer.from(m[2], 'base64')
    if (!buf.length || buf.length > 4 * 1024 * 1024) continue
    const fname = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex') + OK_EXT[m[1]]
    fs.writeFileSync(path.join(dir, fname), buf)
    photos.push('/uploads/deals/' + req.params.id + '/' + fname)
    added++
  }
  if (!added) return res.status(400).json({ error: 'Фото не распознаны' })
  db.prepare('UPDATE deals SET photos = ? WHERE id = ?').run(JSON.stringify(photos), req.params.id)
  addLog(req.params.id, { role: req.role, type: 'photos', text: String(added) })
  res.status(201).json({ ok: true, added })
})

/* Удаление фото из карточки — только админ */
router.delete('/:id/photo', adminOnly, (req, res) => {
  const cur = db.prepare('SELECT photos FROM deals WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Не найдено' })
  const url = String((req.body || {}).url || '')
  const photos = JSON.parse(cur.photos || '[]').filter((p) => p !== url)
  db.prepare('UPDATE deals SET photos = ? WHERE id = ?').run(JSON.stringify(photos), req.params.id)
  touch(req.params.id)
  res.json({ ok: true })
})

router.delete('/:id', adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id)
  if (!r.changes) return res.status(404).json({ error: 'Не найдено' })
  res.json({ ok: true })
})

export default router
