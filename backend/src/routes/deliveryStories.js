import { Router } from 'express'
import db from '../db.js'
import { adminOnly } from '../auth.js'

const router = Router()
const SLUG = /^[a-z0-9-]{2,100}$/
const STAGES = new Set(['shipping', 'border', 'transit', 'customs', 'delivery', 'done'])
const SAFE_MEDIA = /^(?:\/uploads\/[a-z0-9_./-]+\.(?:webp|png|jpe?g|mp4|webm|mov)|https:\/\/[^\s]+)$/i
const fields = `id, slug, title, vehicles, from_city AS fromCity, to_city AS toCity,
  stage, story_date AS storyDate, excerpt, body, video_url AS videoUrl,
  cover_url AS coverUrl, featured, published, sort, created_at AS createdAt, updated_at AS updatedAt`

function present(row) {
  return { ...row, featured: Boolean(row.featured), published: Boolean(row.published) }
}

function cleanText(value, max = 1200) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max)
}

function payload(body) {
  const item = {
    slug: cleanText(body.slug, 100).toLowerCase(),
    title: cleanText(body.title, 180),
    vehicles: cleanText(body.vehicles, 180),
    fromCity: cleanText(body.fromCity, 80),
    toCity: cleanText(body.toCity, 80),
    stage: cleanText(body.stage, 30),
    storyDate: cleanText(body.storyDate, 10),
    excerpt: cleanText(body.excerpt, 500),
    body: cleanText(body.body, 5000),
    videoUrl: cleanText(body.videoUrl, 1000),
    coverUrl: cleanText(body.coverUrl, 1000),
    featured: body.featured ? 1 : 0,
    published: body.published ? 1 : 0,
    sort: Math.max(0, Math.min(9999, Number(body.sort) || 100)),
  }
  if (!SLUG.test(item.slug)) throw new Error('Адрес записи: только латиница, цифры и дефис')
  if (!item.title) throw new Error('Укажите заголовок')
  if (!STAGES.has(item.stage)) throw new Error('Выберите этап доставки')
  if (item.storyDate && !/^\d{4}-\d{2}-\d{2}$/.test(item.storyDate)) throw new Error('Некорректная дата')
  for (const key of ['videoUrl', 'coverUrl']) {
    if (item[key] && !SAFE_MEDIA.test(item[key])) throw new Error('Некорректная ссылка на медиафайл')
  }
  return item
}

router.get('/', (req, res) => {
  const featuredOnly = req.query.featured === '1'
  const where = featuredOnly ? 'WHERE published = 1 AND featured = 1' : 'WHERE published = 1'
  const rows = db.prepare(`SELECT ${fields} FROM delivery_stories ${where} ORDER BY story_date DESC, sort, created_at DESC`).all()
  res.json(rows.map(present))
})

router.get('/all', adminOnly, (_req, res) => {
  const rows = db.prepare(`SELECT ${fields} FROM delivery_stories ORDER BY story_date DESC, sort, created_at DESC`).all()
  res.json(rows.map(present))
})

router.get('/:slug', (req, res) => {
  const row = db.prepare(`SELECT ${fields} FROM delivery_stories WHERE slug = ? AND published = 1`).get(req.params.slug)
  if (!row) return res.status(404).json({ error: 'Запись не найдена' })
  res.json(present(row))
})

router.post('/', adminOnly, (req, res) => {
  try {
    const item = payload(req.body)
    const result = db.prepare(`INSERT INTO delivery_stories
      (slug, title, vehicles, from_city, to_city, stage, story_date, excerpt, body, video_url, cover_url, featured, published, sort)
      VALUES (@slug, @title, @vehicles, @fromCity, @toCity, @stage, @storyDate, @excerpt, @body, @videoUrl, @coverUrl, @featured, @published, @sort)`).run(item)
    const row = db.prepare(`SELECT ${fields} FROM delivery_stories WHERE id = ?`).get(result.lastInsertRowid)
    res.status(201).json(present(row))
  } catch (error) {
    res.status(error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : 400).json({ error: error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Такой адрес уже занят' : error.message })
  }
})

router.put('/:id', adminOnly, (req, res) => {
  try {
    const item = payload(req.body)
    const result = db.prepare(`UPDATE delivery_stories SET
      slug=@slug, title=@title, vehicles=@vehicles, from_city=@fromCity, to_city=@toCity,
      stage=@stage, story_date=@storyDate, excerpt=@excerpt, body=@body, video_url=@videoUrl,
      cover_url=@coverUrl, featured=@featured, published=@published, sort=@sort, updated_at=datetime('now')
      WHERE id = @id`).run({ ...item, id: Number(req.params.id) })
    if (!result.changes) return res.status(404).json({ error: 'Запись не найдена' })
    const row = db.prepare(`SELECT ${fields} FROM delivery_stories WHERE id = ?`).get(req.params.id)
    res.json(present(row))
  } catch (error) {
    res.status(error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : 400).json({ error: error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Такой адрес уже занят' : error.message })
  }
})

router.delete('/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM delivery_stories WHERE id = ?').run(Number(req.params.id))
  if (!result.changes) return res.status(404).json({ error: 'Запись не найдена' })
  res.status(204).end()
})

export default router
