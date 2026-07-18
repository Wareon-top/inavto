/* Провайдеры изображений.
   ВАЖНО: система работает только с разрешёнными источниками —
   собственной медиатекой и лицензированными списками URL.
   Парсинг чужих сайтов не поддерживается сознательно. */
import fs from 'fs'
import path from 'path'

const OK_EXT = /\.(jpe?g|png|webp|avif)$/i

/* Медиатека: папка MEDIA_IN_DIR/<slug>/* или плоские файлы <slug>*.jpg.
   Файл с "main" в имени становится главным. */
export class LocalLibraryProvider {
  constructor(dir) { this.dir = dir }
  available() { return fs.existsSync(this.dir) }
  /** @returns массив источников [{kind:'file', ref, name}] */
  list(slug) {
    if (!this.available()) return []
    const out = []
    const sub = path.join(this.dir, slug)
    if (fs.existsSync(sub) && fs.statSync(sub).isDirectory()) {
      for (const f of fs.readdirSync(sub).sort()) {
        if (OK_EXT.test(f)) out.push({ kind: 'file', ref: path.join(sub, f), name: f })
      }
    }
    for (const f of fs.readdirSync(this.dir).sort()) {
      if (!OK_EXT.test(f)) continue
      const base = f.replace(OK_EXT, '')
      if (base === slug || base.startsWith(slug + '-')) {
        out.push({ kind: 'file', ref: path.join(this.dir, f), name: f })
      }
    }
    const isMain = (s) => /(^|-)main\./i.test(s.name) || /-main(-|$)/i.test(s.name.replace(OK_EXT, '-'))
    out.sort((a, b) => (isMain(b) ? 1 : 0) - (isMain(a) ? 1 : 0))
    return out
  }
}

/* Лицензированный список URL: CSV со строками  slug;url;url;... */
export class UrlCsvProvider {
  constructor(csvPath) {
    this.map = new Map()
    if (csvPath && fs.existsSync(csvPath)) {
      for (const line of fs.readFileSync(csvPath, 'utf-8').split(/\r?\n/)) {
        const [slug, ...urls] = line.split(';').map((s) => s.trim())
        if (slug && urls.length) this.map.set(slug, urls.filter((u) => /^https?:\/\//.test(u)))
      }
    }
  }
  available() { return this.map.size > 0 }
  list(slug) {
    return (this.map.get(slug) || []).map((u, i) => ({ kind: 'url', ref: u, name: `url-${i + 1}` }))
  }
}

/* Загрузка источника в Buffer */
export async function fetchSource(src) {
  if (src.kind === 'file') return fs.promises.readFile(src.ref)
  const r = await fetch(src.ref, { redirect: 'follow' })
  if (!r.ok) throw new Error(`HTTP ${r.status} при загрузке ${src.ref}`)
  return Buffer.from(await r.arrayBuffer())
}
