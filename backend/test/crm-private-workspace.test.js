import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync(new URL('../src/routes/crm.js', import.meta.url), 'utf8')
const database = fs.readFileSync(new URL('../src/db.js', import.meta.url), 'utf8')
const ui = fs.readFileSync(new URL('../public/crm.html', import.meta.url), 'utf8')
const index = fs.readFileSync(new URL('../src/index.js', import.meta.url), 'utf8')

test('personal CRM is isolated from website leads and publications', () => {
  assert.doesNotMatch(route, /syncWebsiteLeads|selections|crm_leads|crm_publications|\/publications/)
  assert.match(route, /\/requests/)
  assert.match(database, /CREATE TABLE IF NOT EXISTS crm_requests/)
  assert.match(database, /CREATE TABLE IF NOT EXISTS crm_request_attachments/)
})

test('request model contains every field from the approved reference', () => {
  for (const field of [
    'request_date', 'brand', 'condition', 'year', 'color',
    'available', 'status', 'note', 'note_color',
  ]) {
    assert.match(route, new RegExp('\\b' + field + '\\b'))
  }
})

test('private attachment API accepts photos and videos behind CRM auth', () => {
  assert.match(route, /kind === 'photo'/)
  assert.match(route, /kind === 'video'/)
  assert.match(route, /crm_request_attachments/)
  assert.match(index, /app\.use\('\/api\/crm', crmOnly, largeJson, crmRouter\)/)
  assert.match(ui, /'Authorization':'Bearer '\+state\.token/)
  assert.doesNotMatch(ui, /X-CRM-Token/)
})

test('UI matches the reference information architecture', () => {
  assert.match(ui, /grid-template-columns:160px minmax\(0,1fr\)/)
  assert.match(ui, /grid-template-columns:minmax\(610px,1fr\) 437px/)
  assert.match(ui, /Марка автомобиля/)
  assert.match(ui, /Состояние/)
  assert.match(ui, /В наличии/)
  assert.match(ui, /Добавить фото/)
  assert.match(ui, /Добавить видео/)
  assert.match(ui, /note_color/)
  assert.doesNotMatch(ui, /Публикации|publications|Воронка|pipeline|Имя клиента|Телефон|Бюджет|Источник/)
})

test('UI remains available in Russian, English and Chinese', () => {
  assert.match(ui, /ru:\{/)
  assert.match(ui, /en:\{/)
  assert.match(ui, /zh:\{/)
  assert.match(ui, /Русский/)
  assert.match(ui, /English/)
  assert.match(ui, /中文/)
})
