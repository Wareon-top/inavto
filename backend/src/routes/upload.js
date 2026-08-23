/* Загрузка фото из админки: JSON { name, data: base64 } -> файл в data/uploads */
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { adminOnly } from '../auth.js'

const router = Router()

export const UPLOAD_DIR = process.env.UPLOAD_DIR ||
  path.join(path.dirname(process.env.DB_PATH || './data/inavto.db'), 'uploads')

const OK_EXT = {
  'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/png': '.png',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
}

router.post('/', adminOnly, (req, res) => {
  const { data, type } = req.body || {}
  if (!data || !OK_EXT[type]) return res.status(400).json({ error: 'Подойдут фото WebP/JPEG/PNG или видео MP4/WebM/MOV' })
  const buf = Buffer.from(String(data).replace(/^data:[^,]+,/, ''), 'base64')
  if (!buf.length) return res.status(400).json({ error: 'Пустой файл' })
  const max = String(type).startsWith('video/') ? 55 * 1024 * 1024 : 4 * 1024 * 1024
  if (buf.length > max) return res.status(413).json({ error: String(type).startsWith('video/') ? 'Видео больше 55 МБ — сожмите его перед загрузкой' : 'Файл больше 4 МБ — сожмите фото' })
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const fname = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex') + OK_EXT[type]
  fs.writeFileSync(path.join(UPLOAD_DIR, fname), buf)
  res.status(201).json({ url: '/uploads/' + fname })
})

export default router
