/* Работа с базой каталога (site_cars). Логика сайта не меняется:
   обновляется только photos (первый элемент — главное фото) и updated_at. */
import Database from 'better-sqlite3'

export class DatabaseUpdater {
  constructor(dbPath) { this.db = new Database(dbPath) }

  cars({ brand, slug, missingOnly } = {}) {
    let rows = this.db.prepare('SELECT slug, brand, name, year, photos FROM site_cars ORDER BY sort, created_at').all()
    if (brand) rows = rows.filter((r) => r.brand.toLowerCase() === brand.toLowerCase())
    if (slug) rows = rows.filter((r) => r.slug === slug)
    if (missingOnly) rows = rows.filter((r) => !JSON.parse(r.photos || '[]').length)
    return rows
  }

  updatePhotos(slug, photos) {
    this.db.prepare(`UPDATE site_cars SET photos = ?, updated_at = datetime('now') WHERE slug = ?`)
      .run(JSON.stringify(photos), slug)
  }

  close() { this.db.close() }
}
