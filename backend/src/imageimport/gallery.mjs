/* Галерея автомобиля: uploads/cars/<slug>/main.webp + gallery-N.webp
   + .hashes.json для SHA256-дедупликации повторных запусков. */
import fs from 'fs'
import path from 'path'
import { sha256, toWebp } from './optimizer.mjs'
import { fetchSource } from './provider.mjs'

export class GalleryCreator {
  constructor(carsDir, cfg) { this.carsDir = carsDir; this.cfg = cfg }

  dirFor(slug) { return path.join(this.carsDir, slug) }
  hashesPath(slug) { return path.join(this.dirFor(slug), '.hashes.json') }

  readHashes(slug) {
    try { return JSON.parse(fs.readFileSync(this.hashesPath(slug), 'utf-8')) } catch { return {} }
  }

  /** Собирает существующие файлы галереи в порядке main → gallery-N */
  existingWeb(slug) {
    const dir = this.dirFor(slug)
    if (!fs.existsSync(dir)) return []
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.webp'))
    files.sort((a, b) => {
      const w = (f) => (f === 'main.webp' ? -1 : parseInt(f.replace(/\D/g, ''), 10) || 0)
      return w(a) - w(b)
    })
    return files.map((f) => `/uploads/cars/${slug}/${f}`)
  }

  /** Импортирует источники одной машины. Возвращает {added, skipped, photos} */
  async build(slug, sources, { dryRun }) {
    const dir = this.dirFor(slug)
    const hashes = this.readHashes(slug)
    let added = 0
    let skipped = 0
    for (const src of sources.slice(0, this.cfg.maxImages)) {
      const raw = await fetchSource(src)
      const h = sha256(raw)
      if (hashes[h]) { skipped++; continue }
      const n = Object.keys(hashes).length
      const fname = n === 0 ? 'main.webp' : `gallery-${n}.webp`
      if (!dryRun) {
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, fname), await toWebp(raw, this.cfg))
        hashes[h] = fname
        fs.writeFileSync(this.hashesPath(slug), JSON.stringify(hashes, null, 1))
      } else {
        hashes[h] = fname
      }
      added++
    }
    return { added, skipped, photos: dryRun ? Object.values(hashes).map((f) => `/uploads/cars/${slug}/${f}`) : this.existingWeb(slug) }
  }
}
