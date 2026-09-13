import { Router } from 'express'
import db from '../db.js'

const router = Router()

export const LEAD_STAGES = [
  { id: 'new', label: 'Новый диалог', tone: 'blue' },
  { id: 'need', label: 'Уточняем потребность', tone: 'violet' },
  { id: 'quote', label: 'Готовим расчёт', tone: 'amber' },
  { id: 'quoted', label: 'Расчёт отправлен', tone: 'orange' },
  { id: 'contact', label: 'Получен контакт', tone: 'teal' },
  { id: 'negotiation', label: 'Переговоры', tone: 'purple' },
  { id: 'contract', label: 'Договор', tone: 'green' },
  { id: 'lost', label: 'Отказ', tone: 'red' },
  { id: 'later', label: 'Отложено', tone: 'gray' },
]

const stageIds = new Set(LEAD_STAGES.map((stage) => stage.id))
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max)
const number = (value) => Math.max(0, Math.round(Number(value) || 0))
const money = (value) => Math.max(0, Number(value) || 0)

/* Заявки с сайта автоматически появляются в CRM. Существующие записи
   не перезаписываются: менеджерская работа остаётся источником истины. */
function syncWebsiteLeads() {
  db.prepare(`
    INSERT OR IGNORE INTO crm_leads (
      external_selection_id, created_at, updated_at, name, contact, source,
      model, budget, stage, next_action, manager_note
    )
    SELECT
      id, created_at, created_at,
      COALESCE(NULLIF(name, ''), 'Без имени'),
      COALESCE(NULLIF(phone, ''), 'Нет контакта'),
      COALESCE(NULLIF(note, ''), 'Сайт INAVTO ASIA'),
      COALESCE(NULLIF(brand, ''), ''),
      COALESCE(NULLIF(budget, ''), ''),
      'new', 'Связаться с клиентом', COALESCE(manager_note, '')
    FROM selections
  `).run()
}

function lead(row) {
  return {
    ...row,
    publication_id: row.publication_id || null,
    is_website_lead: Boolean(row.external_selection_id),
  }
}

function publicationPayload(body) {
  return {
    published_at: clean(body?.published_at, 20),
    platform: clean(body?.platform, 80),
    topic: clean(body?.topic, 180),
    link: clean(body?.link, 600),
    views: number(body?.views), clicks: number(body?.clicks), dialogs: number(body?.dialogs),
    quotes: number(body?.quotes), contacts: number(body?.contacts), contracts: number(body?.contracts),
    cost: money(body?.cost), note: clean(body?.note, 1200),
  }
}

function leadPayload(body) {
  const stage = clean(body?.stage, 40) || 'new'
  return {
    name: clean(body?.name, 120), contact: clean(body?.contact, 160),
    source: clean(body?.source, 240), model: clean(body?.model, 180),
    budget: clean(body?.budget, 80), stage: stageIds.has(stage) ? stage : 'new',
    next_action: clean(body?.next_action, 500), next_action_at: clean(body?.next_action_at, 20),
    manager_note: clean(body?.manager_note, 3000),
    publication_id: Number.isInteger(+body?.publication_id) && +body.publication_id > 0 ? +body.publication_id : null,
  }
}

router.get('/stages', (_req, res) => res.json(LEAD_STAGES))

router.get('/dashboard', (_req, res) => {
  syncWebsiteLeads()
  const stageCounts = Object.fromEntries(
    db.prepare('SELECT stage, COUNT(*) AS count FROM crm_leads GROUP BY stage').all()
      .map((row) => [row.stage, row.count]),
  )
  const publications = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(cost), 0) AS cost, COALESCE(SUM(dialogs), 0) AS dialogs,
      COALESCE(SUM(quotes), 0) AS quotes, COALESCE(SUM(contacts), 0) AS contacts,
      COALESCE(SUM(contracts), 0) AS contracts
    FROM crm_publications
  `).get()
  const today = new Date().toISOString().slice(0, 10)
  const due = db.prepare(`
    SELECT * FROM crm_leads
    WHERE next_action_at != '' AND next_action_at <= ?
      AND stage NOT IN ('contract', 'lost')
    ORDER BY next_action_at ASC, id DESC LIMIT 8
  `).all(today).map(lead)
  res.json({ stage_counts: stageCounts, publications, due, today })
})

router.get('/leads', (_req, res) => {
  syncWebsiteLeads()
  const stage = clean(_req.query.stage, 40)
  const q = clean(_req.query.q, 120)
  const where = []
  const params = []
  if (stage && stageIds.has(stage)) { where.push('l.stage = ?'); params.push(stage) }
  if (q) {
    where.push('(l.name LIKE ? OR l.contact LIKE ? OR l.model LIKE ? OR l.source LIKE ?)')
    params.push(...Array(4).fill(`%${q}%`))
  }
  const items = db.prepare(`
    SELECT l.*, p.topic AS publication_topic, p.platform AS publication_platform
    FROM crm_leads l
    LEFT JOIN crm_publications p ON p.id = l.publication_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY
      CASE WHEN l.next_action_at != '' THEN l.next_action_at END ASC,
      l.updated_at DESC, l.id DESC
  `).all(...params).map(lead)
  res.json(items)
})

router.post('/leads', (req, res) => {
  const item = leadPayload(req.body)
  if (!item.name || !item.contact) return res.status(400).json({ error: 'Укажите имя и контакт' })
  const result = db.prepare(`
    INSERT INTO crm_leads (
      name, contact, source, model, budget, stage, next_action, next_action_at,
      manager_note, publication_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    item.name, item.contact, item.source, item.model, item.budget, item.stage,
    item.next_action, item.next_action_at, item.manager_note, item.publication_id,
  )
  res.status(201).json({ id: result.lastInsertRowid, ok: true })
})

router.put('/leads/:id', (req, res) => {
  const cur = db.prepare('SELECT id FROM crm_leads WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Заявка не найдена' })
  const item = leadPayload(req.body)
  if (!item.name || !item.contact) return res.status(400).json({ error: 'Укажите имя и контакт' })
  db.prepare(`
    UPDATE crm_leads SET
      name = ?, contact = ?, source = ?, model = ?, budget = ?, stage = ?,
      next_action = ?, next_action_at = ?, manager_note = ?, publication_id = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    item.name, item.contact, item.source, item.model, item.budget, item.stage,
    item.next_action, item.next_action_at, item.manager_note, item.publication_id, req.params.id,
  )
  res.json({ ok: true })
})

router.delete('/leads/:id', (req, res) => {
  const result = db.prepare('DELETE FROM crm_leads WHERE id = ? AND external_selection_id IS NULL').run(req.params.id)
  if (!result.changes) return res.status(400).json({ error: 'Заявку с сайта нельзя удалить: отметьте её отказом' })
  res.json({ ok: true })
})

router.get('/publications', (_req, res) => {
  const items = db.prepare('SELECT * FROM crm_publications ORDER BY published_at DESC, id DESC').all()
  res.json(items)
})

router.post('/publications', (req, res) => {
  const item = publicationPayload(req.body)
  if (!item.published_at || !item.platform || !item.topic) {
    return res.status(400).json({ error: 'Укажите дату, площадку и тему публикации' })
  }
  const result = db.prepare(`
    INSERT INTO crm_publications (
      published_at, platform, topic, link, views, clicks, dialogs, quotes,
      contacts, contracts, cost, note, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    item.published_at, item.platform, item.topic, item.link, item.views, item.clicks,
    item.dialogs, item.quotes, item.contacts, item.contracts, item.cost, item.note,
  )
  res.status(201).json({ id: result.lastInsertRowid, ok: true })
})

router.put('/publications/:id', (req, res) => {
  const cur = db.prepare('SELECT id FROM crm_publications WHERE id = ?').get(req.params.id)
  if (!cur) return res.status(404).json({ error: 'Публикация не найдена' })
  const item = publicationPayload(req.body)
  if (!item.published_at || !item.platform || !item.topic) {
    return res.status(400).json({ error: 'Укажите дату, площадку и тему публикации' })
  }
  db.prepare(`
    UPDATE crm_publications SET
      published_at = ?, platform = ?, topic = ?, link = ?, views = ?, clicks = ?,
      dialogs = ?, quotes = ?, contacts = ?, contracts = ?, cost = ?, note = ?,
      updated_at = datetime('now') WHERE id = ?
  `).run(
    item.published_at, item.platform, item.topic, item.link, item.views, item.clicks,
    item.dialogs, item.quotes, item.contacts, item.contracts, item.cost, item.note, req.params.id,
  )
  res.json({ ok: true })
})

router.delete('/publications/:id', (req, res) => {
  const used = db.prepare('SELECT COUNT(*) AS count FROM crm_leads WHERE publication_id = ?').get(req.params.id)
  if (used.count) return res.status(400).json({ error: 'Сначала отвяжите заявки от этой публикации' })
  const result = db.prepare('DELETE FROM crm_publications WHERE id = ?').run(req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'Публикация не найдена' })
  res.json({ ok: true })
})

export default router
