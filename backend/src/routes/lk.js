/* Личный кабинет клиента: доступ по секретной ссылке, без логина и пароля.
   Наружу уходит только безопасное подмножество сделки: без телефона и
   заметок о клиенте, без закупочной цены в юанях, без внутренних
   комментариев и данных представителя. */
import { Router } from 'express'
import db from '../db.js'

const router = Router()

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

/* События, которые видит клиент: смены статуса, фотоотчёты
   и адресованные ему сообщения. Служебные комментарии не отдаём. */
const CLIENT_EVENTS = new Set(['status', 'photos', 'client_msg'])

router.get('/:token', (req, res) => {
  const t = String(req.params.token || '')
  if (!TOKEN_RE.test(t)) return res.status(404).json({ error: 'Не найдено' })
  const row = db.prepare('SELECT * FROM deals WHERE client_token = ?').get(t)
  if (!row) return res.status(404).json({ error: 'Не найдено' })

  const log = JSON.parse(row.log || '[]')
  const docs = db.prepare(`
    SELECT id, name, url, size, ext, created_at FROM docs
    WHERE deal_id = ? AND client_visible = 1
    ORDER BY created_at DESC, id DESC
  `).all(row.id)

  res.json({
    ok: true,
    deal: {
      order: 'IA-' + row.id,
      car: row.car,
      trim: row.trim,
      vin: row.vin,
      color: row.color,
      year: row.year,
      status: row.status,
      from_city: row.from_city,
      to_city: row.to_city,
      ship_date: row.ship_date,
      eta: row.eta,
      client_name: row.client_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      photos: JSON.parse(row.photos || '[]'),
    },
    docs,
    events: log
      .filter((e) => CLIENT_EVENTS.has(e.type))
      /* у событий «смена статуса» текст — служебный комментарий, клиенту не отдаём */
      .map(({ ts, type, text, status }) => (type === 'status' ? { ts, type, status } : { ts, type, text, status })),
  })
})

export default router
