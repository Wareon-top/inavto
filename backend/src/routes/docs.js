/* Документы: раздел с папками в админке + вложения к сделкам журнала.
   admin — всё: папки (создать/переименовать/удалить), загрузка, удаление.
   staff (китайский представитель) — только вложения к сделкам:
   видит и загружает документы конкретной сделки, папки ему недоступны. */
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import db from '../db.js'
import { adminOnly, staffOnly } from '../auth.js'
import { UPLOAD_DIR } from './upload.js'
import { addLog } from './deals.js'

const router = Router()

const MAX_FILE = 15 * 1024 * 1024 // 15 МБ

/* Разрешённые типы: документы и сканы. Видео сознательно нет — тяжело для VPS. */
const EXT_BY_MIME = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/zip': '.zip',
}
const OK_EXTS = new Set(Object.values(EXT_BY_MIME))

const cleanName = (s) => String(s || 'file').replace(/[\\/:*?"<>|]/g, '_').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 180) || 'file'

/* ---------- Папки (только админ) ---------- */
router.get('/folders', adminOnly, (_, res) => {
  const folders = db.prepare(`
    SELECT f.id, f.name, COUNT(d.id) AS files
    FROM doc_folders f LEFT JOIN docs d ON d.folder_id = f.id
    GROUP BY f.id ORDER BY f.name COLLATE NOCASE
  `).all()
  const root = db.prepare('SELECT COUNT(*) AS c FROM docs WHERE folder_id IS NULL AND deal_id IS NULL').get()
  res.json({ folders, rootFiles: root.c })
})

router.post('/folders', adminOnly, (req, res) => {
  const name = cleanName((req.body || {}).name)
  if (!name) return res.status(400).json({ error: 'Нужно имя папки' })
  try {
    const r = db.prepare('INSERT INTO doc_folders (name) VALUES (?)').run(name)
    res.status(201).json({ id: r.lastInsertRowid, ok: true })
  } catch {
    res.status(409).json({ error: 'Такая папка уже есть' })
  }
})

router.put('/folders/:id', adminOnly, (req, res) => {
  const name = cleanName((req.body || {}).name)
  if (!name) return res.status(400).json({ error: 'Нужно имя папки' })
  try {
    const r = db.prepare('UPDATE doc_folders SET name = ? WHERE id = ?').run(name, req.params.id)
    if (!r.changes) return res.status(404).json({ error: 'Не найдено' })
    res.json({ ok: true })
  } catch {
    res.status(409).json({ error: 'Такая папка уже есть' })
  }
})

router.delete('/folders/:id', adminOnly, (req, res) => {
  const folder = db.prepare('SELECT id FROM doc_folders WHERE id = ?').get(req.params.id)
  if (!folder) return res.status(404).json({ error: 'Не найдено' })
  const files = db.prepare('SELECT url FROM docs WHERE folder_id = ?').all(req.params.id)
  for (const f of files) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, f.url.replace(/^\/uploads\//, ''))) } catch { /* файла уже нет */ }
  }
  db.prepare('DELETE FROM docs WHERE folder_id = ?').run(req.params.id)
  db.prepare('DELETE FROM doc_folders WHERE id = ?').run(req.params.id)
  res.json({ ok: true, removed: files.length })
})

/* ---------- Файлы ---------- */
/* Список: админ — по папке (?folder_id=N | без параметра = корень);
   вложения сделки (?deal_id=N) — доступны и представителю. */
router.get('/', staffOnly, (req, res) => {
  const { deal_id, folder_id } = req.query
  if (deal_id) {
    const items = db.prepare('SELECT * FROM docs WHERE deal_id = ? ORDER BY created_at DESC, id DESC').all(deal_id)
    return res.json(items)
  }
  if (req.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' })
  const items = folder_id
    ? db.prepare('SELECT * FROM docs WHERE folder_id = ? ORDER BY created_at DESC, id DESC').all(folder_id)
    : db.prepare('SELECT * FROM docs WHERE folder_id IS NULL AND deal_id IS NULL ORDER BY created_at DESC, id DESC').all()
  res.json(items)
})

/* Загрузка: { name, data: dataURL, folder_id? | deal_id? }.
   Представитель обязан указывать deal_id (только вложения к сделке). */
router.post('/', staffOnly, (req, res) => {
  const b = req.body || {}
  const dealId = b.deal_id ? +b.deal_id : null
  const folderId = b.folder_id ? +b.folder_id : null
  if (req.role !== 'admin' && !dealId) return res.status(401).json({ error: 'Unauthorized' })
  if (dealId && !db.prepare('SELECT id FROM deals WHERE id = ?').get(dealId)) return res.status(404).json({ error: 'Сделка не найдена' })
  if (folderId && !db.prepare('SELECT id FROM doc_folders WHERE id = ?').get(folderId)) return res.status(404).json({ error: 'Папка не найдена' })

  const m = /^data:([^;]+);base64,(.+)$/.exec(String(b.data || ''))
  if (!m) return res.status(400).json({ error: 'Нет файла' })
  const name = cleanName(b.name)
  let ext = EXT_BY_MIME[m[1]] || path.extname(name).toLowerCase()
  if (!OK_EXTS.has(ext)) return res.status(400).json({ error: 'Формат не поддерживается. Можно: PDF, JPG/PNG/WebP, DOC(X), XLS(X), TXT, CSV, ZIP' })
  const buf = Buffer.from(m[2], 'base64')
  if (!buf.length) return res.status(400).json({ error: 'Пустой файл' })
  if (buf.length > MAX_FILE) return res.status(413).json({ error: 'Файл больше 15 МБ' })

  const dir = path.join(UPLOAD_DIR, 'docs')
  fs.mkdirSync(dir, { recursive: true })
  const fname = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex') + ext
  fs.writeFileSync(path.join(dir, fname), buf)
  const url = '/uploads/docs/' + fname

  const r = db.prepare(`
    INSERT INTO docs (folder_id, deal_id, name, url, size, ext, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(dealId ? null : folderId, dealId, name, url, buf.length, ext, req.role)
  if (dealId) addLog(dealId, { role: req.role, type: 'doc', text: name })
  res.status(201).json({ id: r.lastInsertRowid, url, ok: true })
})

router.delete('/:id', adminOnly, (req, res) => {
  const doc = db.prepare('SELECT * FROM docs WHERE id = ?').get(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Не найдено' })
  try { fs.unlinkSync(path.join(UPLOAD_DIR, doc.url.replace(/^\/uploads\//, ''))) } catch { /* файла уже нет */ }
  db.prepare('DELETE FROM docs WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
