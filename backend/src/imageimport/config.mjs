/* Конфигурация импортёра изображений: .env + аргументы CLI */
import 'dotenv/config'
import path from 'path'

export function loadConfig(argv = process.argv.slice(2)) {
  const args = { modes: [], brand: null, slug: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--all') args.modes.push('all')
    else if (a === '--missing-images') args.modes.push('missing')
    else if (a === '--update-only') args.modes.push('updateOnly')
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--no-resume') args.noResume = true
    else if (a === '--brand') args.brand = argv[++i]
    else if (a === '--slug' || a === '--id') args.slug = argv[++i]
    else if (a === '--help' || a === '-h') args.help = true
  }

  const dbPath = process.env.DB_PATH || './data/inavto.db'
  const uploadDir = process.env.UPLOAD_DIR || path.join(path.dirname(dbPath), 'uploads')
  return {
    ...args,
    dbPath,
    uploadDir,
    carsDir: path.join(uploadDir, 'cars'),
    mediaInDir: process.env.MEDIA_IN_DIR || path.join(path.dirname(dbPath), 'media-in'),
    urlCsv: process.env.IMAGES_URL_CSV || '',            // slug;url;url;...  (лицензированный источник)
    logsDir: process.env.IMAGES_LOG_DIR || path.join(path.dirname(dbPath), 'logs'),
    concurrency: Math.max(1, parseInt(process.env.IMAGES_CONCURRENCY || '10', 10)),
    maxImages: Math.max(1, parseInt(process.env.IMAGES_MAX_PER_CAR || '20', 10)),
    width: parseInt(process.env.IMAGES_WIDTH || '1600', 10),
    quality: parseInt(process.env.IMAGES_QUALITY || '85', 10),
  }
}

export const HELP = `Импорт изображений каталога INAVTO ASIA

Источники (в порядке приоритета):
  1. Медиатека: MEDIA_IN_DIR/<slug>/*.jpg|png|webp  или файлы <slug>-1.jpg рядом
  2. Список URL (лицензированный источник): IMAGES_URL_CSV со строками  slug;url;url;...

Режимы:
  --all              все автомобили
  --brand "BYD"      только одна марка
  --slug zeekr-7x    один автомобиль (синоним: --id)
  --missing-images   только машины без фото
  --update-only      не импортировать новое, пересобрать записи БД из уже созданных файлов
  --dry-run          показать, что будет сделано, БД и файлы не трогать
  --no-resume        игнорировать checkpoint предыдущего запуска

Пример: node tools/update-images.mjs --all
`
