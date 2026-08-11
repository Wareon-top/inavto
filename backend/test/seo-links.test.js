import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('geo pages replace legacy model links with the live API catalog', () => {
  const script = fs.readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8')

  assert.match(script, /A\.CATALOG_FROM_API = true/)
  assert.match(script, /function renderGeoCatalog\(\)/)
  assert.match(script, /A\.CARS\.slice\(0, 6\)\.map\(A\.carCard\)/)
  assert.match(script, /renderGeoCatalog\(\)/)
})

test('delivery search snippet matches the cost query and visible page content', () => {
  const page = fs.readFileSync(new URL('../../site/dostavka.html', import.meta.url), 'utf8')

  assert.match(page, /<title>Сколько стоит доставка авто из Китая — цены и сроки \| INAVTO ASIA<\/title>/)
  assert.match(page, /<meta name="description" content="Доставка автомобиля из Китая в Россию от 180 000 ₽\./)
  assert.match(page, /<h1 class="h1">Сколько стоит доставка авто из Китая<\/h1>/)
  assert.match(page, /Логистика из Китая — от 180 000 ₽, полный цикл занимает 40–60 дней\./)
})
