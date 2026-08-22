import { Router } from 'express'
import db from '../db.js'
import { adminOnly } from '../auth.js'

const router = Router()
const fields = 'slug, title, excerpt, category, read_time AS readTime, cover, sort, published, updated_at AS updatedAt'
const safeSlug = /^[a-z0-9-]{2,100}$/
const safeCover = /^\/uploads\/[a-z0-9_-]+\.(?:webp|png|jpe?g)$/i

function present(row) {
  return { ...row, cover: row.cover || '', published: Boolean(row.published) }
}

/* Публичная витрина: только опубликованные статьи и безопасные поля карточек. */
router.get('/', (_req, res) => {
  const posts = db.prepare(`SELECT ${fields} FROM blog_posts WHERE published = 1 ORDER BY sort, created_at DESC`).all()
  res.json(posts.map(present))
})

/* Админка видит весь реестр, чтобы обложку можно было подготовить заранее. */
router.get('/all', adminOnly, (_req, res) => {
  const posts = db.prepare(`SELECT ${fields} FROM blog_posts ORDER BY sort, created_at DESC`).all()
  res.json(posts.map(present))
})

/* Для каждой статьи хранится ровно одна обложка. Новая ссылка заменяет старую. */
router.put('/:slug', adminOnly, (req, res) => {
  const slug = String(req.params.slug || '')
  const cover = req.body?.cover
  if (!safeSlug.test(slug)) return res.status(400).json({ error: 'Некорректный адрес статьи' })
  if (typeof cover !== 'string' || (cover && !safeCover.test(cover))) {
    return res.status(400).json({ error: 'Некорректный путь к обложке' })
  }
  const result = db.prepare("UPDATE blog_posts SET cover = ?, updated_at = datetime('now') WHERE slug = ?").run(cover, slug)
  if (!result.changes) return res.status(404).json({ error: 'Статья не найдена' })
  const post = db.prepare(`SELECT ${fields} FROM blog_posts WHERE slug = ?`).get(slug)
  res.json(present(post))
})

export default router
