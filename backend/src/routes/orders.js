import { Router } from 'express'
import db from '../db.js'
import { adminOnly } from '../auth.js'
import { notifyAdmin } from '../bot.js'

const router = Router()

const VALID_STATUSES = ['search', 'found', 'bought', 'shipping', 'customs', 'delivery', 'done']

router.get('/:id', adminOnly, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json(order)
})

router.get('/', adminOnly, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
  res.json(orders)
})

router.post('/', adminOnly, (req, res) => {
  const { id, car_name, price, status = 'search', note, eta, client_name, client_phone } = req.body
  if (!id || !car_name || !price) return res.status(400).json({ error: 'id, car_name, price required' })

  db.prepare(`
    INSERT INTO orders (id, car_name, price, status, note, eta, client_name, client_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, car_name, price, status, note, eta, client_name, client_phone)

  res.status(201).json({ ok: true })
})

router.put('/:id/status', adminOnly, async (req, res) => {
  const { status, note } = req.body
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  db.prepare('UPDATE orders SET status = ?, note = COALESCE(?, note) WHERE id = ?')
    .run(status, note || null, req.params.id)

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (order) {
    const statusLabels = {
      search: '🔍 Поиск', found: '✅ Найден', bought: '💰 Выкуплен',
      shipping: '🚢 Отправлен', customs: '🛃 Таможня', delivery: '🚚 Доставка', done: '🎉 Готово'
    }
    await notifyAdmin(
      `📦 <b>Обновлён статус заказа</b> ${req.params.id}\n\n` +
      `🚗 ${order.car_name}\n` +
      `📌 Статус: <b>${statusLabels[status]}</b>\n` +
      (note ? `📝 ${note}` : '')
    )
  }

  res.json({ ok: true })
})

export default router
