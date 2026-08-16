#!/usr/bin/env node
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { auditCatalogSite } from '../src/catalogSiteAudit.js'

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const dbPath = value('--db', process.env.DB_PATH || './data/inavto.db')
const wwwDir = value('--www', process.env.WWW_DIR || '/var/www/inavto')
const expectedArg = value('--expected-total', '')
const expectedTotal = expectedArg === '' ? undefined : Number(expectedArg)
const quiet = args.includes('--quiet')

try {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  const rows = db.prepare('SELECT slug, hidden FROM site_cars ORDER BY slug').all()
  db.close()

  const sitemap = fs.readFileSync(path.join(wwwDir, 'sitemap.xml'), 'utf8')
  const robots = fs.readFileSync(path.join(wwwDir, 'robots.txt'), 'utf8')
  const result = auditCatalogSite({
    rows,
    sitemap,
    robots,
    expectedTotal,
    readPage: (slug) => {
      try { return fs.readFileSync(path.join(wwwDir, 'cars', `${slug}.html`), 'utf8') }
      catch { return '' }
    },
  })

  if (!result.ok) {
    if (!quiet) {
      console.error(`[INAVTO] Проверка каталога не пройдена (${result.total} записей, ${result.active} активных, ${result.sitemapCars} URL в sitemap):`)
      for (const issue of result.issues) console.error(`  - ${issue}`)
    }
    process.exit(1)
  }

  if (!quiet) console.log(`[INAVTO] Каталог и sitemap совпадают: ${result.total} записей, ${result.active} активных карточек.`)
} catch (error) {
  if (!quiet) console.error(`[INAVTO] Не удалось проверить каталог и sitemap: ${error.message}`)
  process.exit(1)
}
