/**
 * Отдельная страница в Google для каждой машины каталога.
 *
 * В репозитории лежат страницы только для встроенных моделей (js/data.js),
 * а весь остальной каталог живёт в базе и добавляется через админку. Здесь
 * бэкенд достраивает недостающие страницы прямо в каталоге сайта:
 *   <WWW_DIR>/cars/<slug>.html  — по тому же шаблону, что и build-pages.mjs
 *   <WWW_DIR>/sitemap.xml       — карта сайта со всеми машинами
 *
 * Когда это запускается:
 *   • при старте бэкенда (то есть после каждого deploy/update.sh — rsync
 *     затирает сгенерированное, перезапуск службы восстанавливает);
 *   • через несколько секунд после правки каталога в админке.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import db from './db.js'
import { rowToCar } from './carRow.js'
import { catalogSitemapSlugs } from './sitemapPolicy.js'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
/* Исходники сайта в репозитории (для шаблона и списка встроенных моделей) */
const SITE_DIR = path.resolve(ROOT, '../../site')
/* Куда nginx смотрит корнем сайта. В разработке подменяется переменной. */
export const WWW_DIR = process.env.WWW_DIR || '/var/www/inavto'

const DEBOUNCE_MS = Number(process.env.SITEGEN_DEBOUNCE_MS || 5000)

let tpl = null
async function template() {
  if (!tpl) tpl = await import(pathToFileURL(path.join(SITE_DIR, 'build-pages.mjs')).href)
  return tpl
}

const htmlSlugs = (dir) => {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5))
  } catch { return [] }
}

/* У каких машин есть собственная страница — каталог ставит ссылку на неё,
   а не на служебный car.html (он закрыт от поисковиков). Кэш на 30 секунд,
   чтобы не читать папку на каждый запрос каталога. */
let slugCache = { at: 0, set: new Set() }
export function staticSlugs() {
  const now = Date.now()
  if (now - slugCache.at > 30_000) {
    slugCache = { at: now, set: new Set(htmlSlugs(path.join(WWW_DIR, 'cars'))) }
  }
  return slugCache.set
}
const dropSlugCache = () => { slugCache = { at: 0, set: new Set() } }

/* Пишем только если содержимое изменилось: меньше износ диска и понятнее,
   что реально обновилось (дата файла = дата правки каталога). */
function writeIfChanged(file, content) {
  try {
    if (fs.readFileSync(file, 'utf8') === content) return false
  } catch { /* файла ещё нет */ }
  fs.writeFileSync(file, content)
  return true
}

/**
 * Пересобрать страницы машин и карту сайта.
 * @returns {Promise<{ok:boolean, reason?:string, total?:number, written?:number, removed?:number}>}
 */
export async function rebuildSitePages() {
  if (!fs.existsSync(WWW_DIR)) return { ok: false, reason: `нет каталога ${WWW_DIR}` }

  const rows = db.prepare('SELECT * FROM site_cars ORDER BY sort, created_at').all()
  /* Пустая база (свежая установка) — не трогаем то, что выложено из репозитория */
  if (!rows.length) return { ok: false, reason: 'каталог в базе пуст' }

  const { carPageHTML, sitemapXML, robotsTxt } = await template()

  const visible = rows.filter((r) => !r.hidden).map(rowToCar)
  const dbSlugs = new Set(rows.map((r) => r.slug))
  const visibleSlugs = catalogSitemapSlugs(rows)

  /* Страницы моделей, которых в базе нет вовсе, оставляем как есть:
     они пришли из репозитория (js/data.js) и остаются рабочими. */
  const extra = htmlSlugs(path.join(SITE_DIR, 'cars')).filter((s) => !dbSlugs.has(s)).sort()
  const keep = new Set([...visibleSlugs, ...extra])

  const outDir = path.join(WWW_DIR, 'cars')
  fs.mkdirSync(outDir, { recursive: true })

  let written = 0
  for (const car of visible) {
    if (writeIfChanged(path.join(outDir, `${car.slug}.html`), carPageHTML(car, visible))) written++
  }

  /* Убираем страницы снятых с публикации машин, чтобы Google не отдавал
     ссылки на то, чего в каталоге больше нет. */
  let removed = 0
  for (const slug of htmlSlugs(outDir)) {
    if (keep.has(slug)) continue
    try { fs.unlinkSync(path.join(outDir, `${slug}.html`)); removed++ } catch { /* уже удалена */ }
  }

  /* В sitemap публикуем только актуальные видимые машины из базы. Файлы
     встроенных моделей из репозитория сохраняем для обратной совместимости,
     но не предлагаем Google как часть действующего каталога. */
  writeIfChanged(path.join(WWW_DIR, 'sitemap.xml'), sitemapXML(visibleSlugs))
  writeIfChanged(path.join(WWW_DIR, 'robots.txt'), robotsTxt())
  dropSlugCache()

  return { ok: true, total: visibleSlugs.length, preserved: extra.length, written, removed }
}

let timer = null
/** Пересборка через несколько секунд после последней правки каталога. */
export function scheduleSiteRebuild() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    rebuildSitePages()
      .then((r) => {
        if (r.ok) console.log(`[INAVTO] Страницы каталога: ${r.total} (обновлено ${r.written}, удалено ${r.removed})`)
        else console.log(`[INAVTO] Страницы каталога не пересобраны: ${r.reason}`)
      })
      .catch((e) => console.error('[INAVTO] Ошибка генерации страниц:', e.message))
  }, DEBOUNCE_MS)
  timer.unref?.()
}
