import { Router } from 'express'
import db from '../db.js'
import { notifyAdmin } from '../bot.js'
import { adminOnly } from '../auth.js'

const router = Router()

router.post('/', async (req, res) => {
  const { budget, brand, body, fuel, name, phone, city, note, tg_user_id } = req.body
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' })

  const result = db.prepare(`
    INSERT INTO selections (budget, brand, body, fuel, name, phone, city, note, tg_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(budget, brand, body, fuel, name, phone, city, note || null, tg_user_id || null)

  const lines = [
    `🚗 <b>Новая заявка на подбор</b> #${result.lastInsertRowid}`,
    ``,
    `👤 <b>Клиент:</b> ${name}`,
    `📞 <b>Контакт:</b> ${phone}`,
  ]
  if (city) lines.push(`🏙 <b>Город:</b> ${city}`)
  lines.push(``)
  if (budget) lines.push(`💰 <b>Бюджет:</b> ${budget}`)
  if (brand) lines.push(`🏷 <b>Интересует:</b> ${brand}`)
  if (body) lines.push(`🚙 <b>Кузов:</b> ${body}`)
  if (fuel) lines.push(`⛽ <b>Двигатель:</b> ${fuel}`)
  if (note) lines.push(`📝 <b>Детали:</b> ${note}`)

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
