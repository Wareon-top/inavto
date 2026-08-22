import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('blog has a public API, admin cover controls and home preview', () => {
  const route = read('backend/src/routes/blog.js')
  const db = read('backend/src/db.js')
  const admin = read('backend/public/admin.html')
  const home = read('site/index.html')
  const blog = read('site/blog/index.html')

  assert.match(db, /CREATE TABLE IF NOT EXISTS blog_posts/)
  assert.match(route, /router\.get\('\/'/)
  assert.match(route, /router\.get\('\/all', adminOnly/)
  assert.match(route, /router\.put\('\/:slug', adminOnly/)
  assert.match(route, /safeCover/)
  assert.match(admin, /data-view="blog"/)
  assert.match(admin, /data-blog-upload/)
  assert.match(home, /id="home-blog-list"/)
  assert.match(home, /Больше статей/)
  assert.match(blog, /id="blog-list-public"/)
})
