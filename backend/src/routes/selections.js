import { Router } from 'express'
import db from '../db.js'
import { notifyAdmin } from '../bot.js'
import { adminOnly, roleOf } from '../auth.js'

const router = Router()
const clean = (value, max) => String(value ?? '').trim().slice(0, max)
const html = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char])

router.post('/', async (req, res) => {
  const name = clean(req.body?.name, 120)
  const phone = clean(req.body?.phone, 120)
  const budget = clean(req.body?.budget, 120)
  const brand = clean(req.body?.brand, 160)
  const body = clean(req.body?.body, 80)
  const fuel = clean(req.body?.fuel, 80)
  const city = clean(req.body?.city, 120)
  const note = clean(req.body?.note, 1200)
  const pageUrl = clean(req.body?.page_url, 500)
  const carName = clean(req.body?.car_name, 160)
  const leadNote = clean([
    note,
    carName ? `Автомобиль: ${carName}` : '',
    pageUrl ? `Страница: ${pageUrl}` : '',
  ].filter(Boolean).join(' · '), 2000)
  const tg_user_id = clean(req.body?.tg_user_id, 80)
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' })

  const result = db.prepare(`
    INSERT INTO selections (budget, brand, body, fuel, name, phone, city, note, tg_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(budget || null, brand || null, body || null, fuel || null, name, phone, city || null, leadNote || null, tg_user_id || null)

  /* Заявку добавил менеджер из CRM — в Telegram не дублируем */
  if (roleOf(req) === 'admin') {
    return res.status(201).json({ id: result.lastInsertRowid, ok: true })
  }

  const lines = [
    `🚗 <b>Новая заявка на подбор</b> #${result.lastInsertRowid}`,
    ``,
    `👤 <b>Клиент:</b> ${html(name)}`,
    `📞 <b>Контакт:</b> ${html(phone)}`,
  ]
  if (city) lines.push(`🏙 <b>Город:</b> ${html(city)}`)
  lines.push(``)
  if (budget) lines.push(`💰 <b>Бюджет:</b> ${html(budget)}`)
  if (brand) lines.push(`🏷 <b>Интересует:</b> ${html(brand)}`)
  if (body) lines.push(`🚙 <b>Кузов:</b> ${html(body)}`)
  if (fuel) lines.push(`⛽ <b>Двигатель:</b> ${html(fuel)}`)
  if (leadNote) lines.push(`📝 <b>Детали:</b> ${html(leadNote)}`)

  await notifyAdmin(lines.join('\n'))

  res.status(201).json({ id: result.lastInsertRowid, ok: true })
})

router.get('/', adminOnly, (req, res) => {
  const items = db.prepare('SELECT * FROM selections ORDER BY created_at DESC, id DESC').all()
  res.json(items)
})

router.put('/:id/status', adminOnly, (req, res) => {
  const { status } = req.body
  db.prepare('UPDATE selections SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ ok: true })
})

/* CRM: обновление статуса и/или комментария менеджера */
router.put('/:id', adminOnly, (req, res) => {
  const { status, manager_note } = req.body
  const cur = db.prepare('SELECT id FROM selections WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Не найдено' })
  if (status !== undefined) db.prepare('UPDATE selections SET status = ? WHERE id = ?').run(String(status), req.params.id)
  if (manager_note !== undefined) db.prepare('UPDATE selections SET manager_note = ? WHERE id = ?').run(String(manager_note), req.params.id)
  res.json({ ok: true })
})

/* CRM: удаление заявки (спам/тест) */
router.delete('/:id', adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM selections WHERE id = ?').run(req.params.id)
  if (!r.changes) return res.status(404).json({ error: 'Не найдено' })
  res.json({ ok: true })
})

export default router
