/* Оркестратор: очередь на N потоков, checkpoint, прогресс-бар, статистика */
import fs from 'fs'
import path from 'path'
import { loadConfig, HELP } from './config.mjs'
import { Logger } from './logger.mjs'
import { LocalLibraryProvider, UrlCsvProvider } from './provider.mjs'
import { GalleryCreator } from './gallery.mjs'
import { DatabaseUpdater } from './db.mjs'

const fmtDur = (ms) => {
  const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000)
  return m ? `${m} мин ${s} с` : `${s} с`
}

export async function run(argv) {
  const cfg = loadConfig(argv)
  if (cfg.help || (!cfg.modes.length && !cfg.brand && !cfg.slug)) { console.log(HELP); return 0 }

  const log = new Logger(cfg.logsDir)
  const db = new DatabaseUpdater(cfg.dbPath)
  const gallery = new GalleryCreator(cfg.carsDir, cfg)
  const providers = [new LocalLibraryProvider(cfg.mediaInDir), new UrlCsvProvider(cfg.urlCsv)]
    .filter((p) => p.available())

  const updateOnly = cfg.modes.includes('updateOnly')
  if (!providers.length && !updateOnly) {
    console.error(`Нет источников изображений: положите файлы в ${cfg.mediaInDir}\n` +
      `(папка <slug>/ с фото или файлы вида <slug>-1.jpg), либо задайте IMAGES_URL_CSV.`)
    return 1
  }

  const cars = db.cars({ brand: cfg.brand, slug: cfg.slug, missingOnly: cfg.modes.includes('missing') })
  if (!cars.length) { console.log('Под условия не попала ни одна машина.'); return 0 }

  /* checkpoint: обработанные слаги текущей конфигурации */
  const cpPath = path.join(cfg.logsDir, 'import-checkpoint.json')
  const cpKey = JSON.stringify({ b: cfg.brand, s: cfg.slug, m: cfg.modes })
  let done = new Set()
  if (!cfg.noResume && fs.existsSync(cpPath)) {
    try {
      const cp = JSON.parse(fs.readFileSync(cpPath, 'utf-8'))
      if (cp.key === cpKey) done = new Set(cp.done)
    } catch { /* пустой/битый checkpoint */ }
  }
  const saveCp = () => { if (!cfg.dryRun) fs.writeFileSync(cpPath, JSON.stringify({ key: cpKey, done: [...done] })) }

  const queue = cars.filter((c) => !done.has(c.slug))
  const total = cars.length
  const stats = { processed: done.size, added: 0, skipped: 0, errors: 0, noSource: 0 }
  const t0 = Date.now()
  const bar = () => {
    const pct = Math.round((stats.processed / total) * 100)
    process.stdout.write(`\r${String(stats.processed).padStart(4)} / ${total}  ${String(pct).padStart(3)}%  `)
  }
  bar()

  async function worker() {
    for (;;) {
      const car = queue.shift()
      if (!car) return
      try {
        if (updateOnly) {
          const photos = gallery.existingWeb(car.slug)
          if (photos.length && !cfg.dryRun) db.updatePhotos(car.slug, photos)
          log.info(`${car.name} — update-only, файлов: ${photos.length}`)
        } else {
          const sources = providers.flatMap((p) => p.list(car.slug))
          if (!sources.length) {
            stats.noSource++
            log.notFound(car.slug, car.name)
          } else {
            const r = await gallery.build(car.slug, sources, { dryRun: cfg.dryRun })
            stats.added += r.added
            stats.skipped += r.skipped
            if (r.photos.length && !cfg.dryRun) db.updatePhotos(car.slug, r.photos)
            log.info(`${car.name} — найдено ${sources.length}, загружено ${r.added}, пропущено (дубли) ${r.skipped}${cfg.dryRun ? ' [dry-run]' : ' — обновлено'}`)
          }
        }
      } catch (e) {
        stats.errors++
        log.error(car.slug, e)
      }
      done.add(car.slug)
      stats.processed++
      saveCp()
      bar()
    }
  }

  await Promise.all(Array.from({ length: Math.min(cfg.concurrency, queue.length || 1) }, worker))
  if (!cfg.dryRun && stats.processed >= total) { try { fs.unlinkSync(cpPath) } catch { /* нет файла */ } }
  db.close()

  console.log(`\n\nОбработано:        ${stats.processed} / ${total}`)
  console.log(`Новых изображений: ${stats.added}`)
  console.log(`Пропущено (дубли): ${stats.skipped}`)
  console.log(`Без источника:     ${stats.noSource}  (см. logs/not_found.log)`)
  console.log(`Ошибок:            ${stats.errors}${stats.errors ? '  (см. logs/errors.log)' : ''}`)
  console.log(`Время:             ${fmtDur(Date.now() - t0)}${cfg.dryRun ? '\nРежим DRY-RUN: база и файлы не менялись.' : ''}`)
  return stats.errors ? 2 : 0
}
