import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const admin = fs.readFileSync(path.resolve(here, '../public/admin.html'), 'utf8')

test('admin engine selector includes diesel', () => {
  const select = admin.match(/<select id="f-fuel">([\s\S]*?)<\/select>/)?.[1] || ''

  assert.match(select, /<option>Дизель<\/option>/)
  assert.match(admin, /'Дизель': '柴油'/)
  assert.match(admin, /'Дизель': 'Diesel'/)
})

test('catalog tag selector includes diesel and minivan', () => {
  const tags = admin.match(/const TAGS = \[([\s\S]*?)\n\];/)?.[1] || ''

  assert.match(tags, /\['diesel','Дизель'\]/)
  assert.match(tags, /\['minivan','Минивэн'\]/)
})

test('public catalog exposes diesel engine and minivan body filters', () => {
  const catalog = fs.readFileSync(path.resolve(here, '../../site/catalog.html'), 'utf8')
  const fuel = catalog.match(/<select id="f-fuel">([\s\S]*?)<\/select>/)?.[1] || ''
  const body = catalog.match(/<select id="f-body">([\s\S]*?)<\/select>/)?.[1] || ''

  assert.match(fuel, /<option value="diesel">Дизель<\/option>/)
  assert.match(body, /<option>Минивэн<\/option>/)
})
