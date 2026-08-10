import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inavto-security-'))
process.env.DB_PATH = path.join(tempDir, 'test.db')
process.env.UPLOAD_DIR = path.join(tempDir, 'uploads')
process.env.ADMIN_TOKEN = 'test-admin-token'
process.env.CORS_ORIGINS = 'https://inavtoasia.ru'

const { app } = await import('../src/index.js')

let server
let baseUrl

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  fs.rmSync(tempDir, { recursive: true, force: true })
})

test('orders never expose client data without an admin token', async () => {
  const list = await fetch(baseUrl + '/api/orders')
  assert.equal(list.status, 401)

  const detail = await fetch(baseUrl + '/api/orders/INV-2024-001')
  assert.equal(detail.status, 401)
})

test('admin can still access the protected orders API', async () => {
  const response = await fetch(baseUrl + '/api/orders', {
    headers: { Authorization: 'Bearer test-admin-token' },
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), [])
})

test('security headers are present and framework header is hidden', async () => {
  const response = await fetch(baseUrl + '/api/health')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-powered-by'), null)
})

test('CORS only permits configured external origins', async () => {
  const allowed = await fetch(baseUrl + '/api/health', {
    headers: { Origin: 'https://inavtoasia.ru' },
  })
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://inavtoasia.ru')

  const denied = await fetch(baseUrl + '/api/health', {
    headers: { Origin: 'https://attacker.example' },
  })
  assert.equal(denied.headers.get('access-control-allow-origin'), null)
})

test('public lead endpoint rejects oversized JSON before writing', async () => {
  const response = await fetch(baseUrl + '/api/selections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', phone: '+70000000000', note: 'x'.repeat(300_000) }),
  })
  assert.equal(response.status, 413)
})

test('security checks do not modify the site catalog', async () => {
  const response = await fetch(baseUrl + '/api/site-cars')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), [])
})

test('admin can publish an explicitly dated hot lot without affecting other cars', async () => {
  const response = await fetch(baseUrl + '/api/site-cars', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-admin-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: 'stage-one-test', name: 'Stage One Test', brand: 'Test', price_rub: 3.5,
      hot: { oldPrice: 4.1, deadline: '2027-01-01T12:00' },
    }),
  })
  assert.equal(response.status, 201)

  const catalog = await fetch(baseUrl + '/api/site-cars').then((r) => r.json())
  assert.equal(catalog.length, 1)
  assert.deepEqual(catalog[0].hot, { oldPrice: 4.1, deadline: '2027-01-01T12:00' })
})

test('documents require admin or client authorization without deleting stored files', async () => {
  const auth = {
    Authorization: 'Bearer test-admin-token',
    'Content-Type': 'application/json',
  }
  const dealResponse = await fetch(baseUrl + '/api/deals', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ car: 'Security Test Car', client_name: 'Test Client' }),
  })
  assert.equal(dealResponse.status, 201)
  const { id: dealId } = await dealResponse.json()

  const upload = await fetch(baseUrl + '/api/docs', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      deal_id: dealId,
      name: 'check.txt',
      data: 'data:text/plain;base64,c2VjdXJl',
    }),
  })
  assert.equal(upload.status, 201)
  const document = await upload.json()

  const legacyUrl = await fetch(baseUrl + '/uploads/docs/example.txt')
  assert.equal(legacyUrl.status, 404)
  const anonymous = await fetch(baseUrl + document.url)
  assert.equal(anonymous.status, 401)
  const adminDownload = await fetch(baseUrl + document.url, { headers: auth })
  assert.equal(adminDownload.status, 200)
  assert.equal(await adminDownload.text(), 'secure')

  const linkResponse = await fetch(baseUrl + `/api/deals/${dealId}/client-link`, {
    method: 'POST', headers: auth, body: '{}',
  })
  const { token } = await linkResponse.json()
  const publicStatusPage = await fetch(baseUrl + `/status/${token}`)
  assert.equal(publicStatusPage.status, 200)
  assert.match(await publicStatusPage.text(), /Личный кабинет — INAVTO ASIA/)
  const cabinet = await fetch(baseUrl + `/api/lk/${token}`)
  assert.equal(cabinet.status, 200)
  const cabinetData = await cabinet.json()
  const clientUrl = cabinetData.orders[0].docs[0].url
  const clientDownload = await fetch(baseUrl + clientUrl)
  assert.equal(clientDownload.status, 200)
  assert.equal(await clientDownload.text(), 'secure')
})
