import { Router } from 'express'
import db from '../db.js'
import { notifyAdmin } from '../bot.js'

const router = Router()

router.post('/', async (req, res) => {
  const { budget, brand, body, fuel, name, phone, city, tg_user_id } = req.body
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' })

  const result = db.prepare(`
    INSERT INTO selections (budget, brand, body, fuel, name, phone, city, tg_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(budget, brand, body, fuel, name, phone, city, tg_user_id || null)

  await notifyAdmin(
    `🚗 <b>Новая заявка на подбор</b> #${result.lastInsertRowid}\n\n` +
    `👤 <b>Клиент:</b> ${name}\n` +
    `📞 <b>Контакт:</b> ${phone}\n` +
    `🏙 <b>Город:</b> ${city || 'не указан'}\n\n` +
    `💰 <b>Бюджет:</b> ${budget}\n` +
    `🏷 <b>Марка:</b> ${brand}\n` +
    `🚙 <b>Кузов:</b> ${body}\n` +
    `⛽ <b>Двигатель:</b> ${fuel}`
  )

  res.status(201).json({ id: result.lastInsertRowid, ok: true })
})

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM selections ORDER BY created_at DESC').all()
  res.json(items)
})

router.put('/:id/status', (req, res) => {
  const { status } = req.body
  db.prepare('UPDATE selections SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ ok: true })
})

export default router
