/* Каталог сайта INAVTO ASIA: публичное чтение, изменения — только из админки */
import { Router } from 'express'
import db from '../db.js'
import { adminOnly } from '../auth.js'

const router = Router()

const rowToCar = (r) => ({
  slug: r.slug,
  brand: r.brand,
  name: r.name,
  country: 'china',
  body: r.body,
  fuel: r.fuel,
  power: r.power,
  drive: r.drive,
  range: r.range || '—',
  battery: r.battery || '—',
  price: r.price_rub,
  priceCny: r.price_cny || 0,
  priceUsd: r.price_usd || 0,
  year: r.year,
  tags: JSON.parse(r.tags || '[]'),
  grad: JSON.parse(r.grad || '["#37424e","#141a20"]'),
  desc: r.descr || '',
  photos: JSON.parse(r.photos || '[]'),
  hidden: Boolean(r.hidden),
  sort: r.sort,
})

/* Публично: каталог для сайта (только видимые) */
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM site_cars WHERE hidden = 0 ORDER BY sort, created_at').all()
  res.json(rows.map(rowToCar))
})

/* Проверка ключа админки */
router.get('/check', adminOnly, (req, res) => res.json({ ok: true }))

/* Админка: полный список, включая скрытые */
router.get('/all', adminOnly, (req, res) => {
  const rows = db.prepare('SELECT * FROM site_cars ORDER BY sort, created_at').all()
  res.json(rows.map(rowToCar))
})

const FIELDS = ['brand', 'name', 'body', 'fuel', 'power', 'drive', 'range', 'battery',
  'price_rub', 'price_cny', 'price_usd', 'year', 'tags', 'grad', 'descr', 'photos', 'sort', 'hidden']

function carPayload(body) {
  const p = {}
  p.brand = String(body.brand || '').trim()
  p.name = String(body.name || '').trim()
  p.body = String(body.body || 'Кроссовер')
  p.fuel = String(body.fuel || 'Бензин')
  p.power = String(body.power || '')
  p.drive = String(body.drive || '')
  p.range = String(body.range || '—')
  p.battery = String(body.battery || '—')
  p.price_rub = Number(body.price_rub ?? body.price) || 0
  p.price_cny = Math.round(Number(body.price_cny) || 0)
  p.price_usd = Math.round(Number(body.price_usd) || 0)
  p.year = Math.round(Number(body.year) || 2026)
  p.tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : [])
  p.grad = JSON.stringify(Array.isArray(body.grad) && body.grad.length === 2 ? body.grad : ['#37424e', '#141a20'])
  p.descr = String(body.desc ?? body.descr ?? '')
  p.photos = JSON.stringify(Array.isArray(body.photos) ? body.photos : [])
  p.sort = Math.round(Number(body.sort) || 100)
  p.hidden = body.hidden ? 1 : 0
  return p
}

router.post('/', adminOnly, (req, res) => {
  const slug = String(req.body.slug || '').trim().toLowerCase()
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return res.status(400).json({ error: 'Некорректный слаг (латиница, цифры, дефис)' })
  const p = carPayload(req.body)
  if (!p.name || !p.price_rub) return res.status(400).json({ error: 'Нужны название и цена в ₽' })
  const exists = db.prepare('SELECT slug FROM site_cars WHERE slug = ?').get(slug)
  if (exists) return res.status(409).json({ error: 'Такой слаг уже есть' })
  db.prepare(`INSERT INTO site_cars (slug, ${FIELDS.join(', ')})
    VALUES (?, ${FIELDS.map(() => '?').join(', ')})`).run(slug, ...FIELDS.map((f) => p[f]))
  res.status(201).json({ ok: true, slug })
})

router.put('/:slug', adminOnly, (req, res) => {
  const p = carPayload(req.body)
  if (!p.name || !p.price_rub) return res.status(400).json({ error: 'Нужны название и цена в ₽' })
  const r = db.prepare(`UPDATE site_cars SET ${FIELDS.map((f) => f + '=?').join(', ')},
    updated_at = datetime('now') WHERE slug = ?`).run(...FIELDS.map((f) => p[f]), req.params.slug)
  if (!r.changes) return res.status(404).json({ error: 'Не найдено' })
  res.json({ ok: true })
})

router.delete('/:slug', adminOnly, (req, res) => {
  db.prepare('DELETE FROM site_cars WHERE slug = ?').run(req.params.slug)
  res.json({ ok: true })
})

/* Первичное наполнение: массив машин в формате data.js */
router.post('/import', adminOnly, (req, res) => {
  const cars = Array.isArray(req.body.cars) ? req.body.cars : []
  if (!cars.length) return res.status(400).json({ error: 'Пустой список' })
  const insert = db.prepare(`INSERT OR REPLACE INTO site_cars (slug, ${FIELDS.join(', ')})
    VALUES (?, ${FIELDS.map(() => '?').join(', ')})`)
  let n = 0
  for (const c of cars) {
    const slug = String(c.slug || '').trim().toLowerCase()
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) continue
    const p = carPayload({ ...c, price_rub: c.price, sort: 100 + n })
    insert.run(slug, ...FIELDS.map((f) => p[f]))
    n++
  }
  res.json({ ok: true, imported: n })
})

export default router
