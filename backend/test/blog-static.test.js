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

test('every article continues into service pages and related reading', () => {
  const main = read('site/js/main.js')
  const css = read('site/css/style.css')
  const slugs = [
    'lixiang-l7-ili-l9',
    'skolko-stoit-privezti-avto-iz-kitaya-2026',
    'utilsbor-2026',
    'erev-vs-phev',
    'kak-proverit-posrednika',
  ]

  for (const slug of slugs) {
    const article = read(`site/blog/${slug}.html`)
    assert.match(article, new RegExp(`data-blog-article="${slug}"`))
  }
  assert.match(main, /href="catalog\.html" data-goal="article_to_catalog"/)
  assert.match(main, /href="garantii\.html" data-goal="article_to_warranty"/)
  assert.match(main, /href="dostavka\.html" data-goal="article_to_delivery"/)
  assert.match(main, /href="kak-my-rabotaem\.html" data-goal="article_to_process"/)
  assert.match(main, /Читайте также/)
  assert.match(main, /post\.slug !== currentSlug/)
  assert.match(main, /data-article-cover/)
  assert.match(main, /current\.cover/)
  assert.match(css, /\.article-path-grid/)
  assert.match(css, /\.article-hero-cover/)
})
