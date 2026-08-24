import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('cost article and delivery page link to each other', () => {
  const costArticle = fs.readFileSync(new URL('../../site/blog/skolko-stoit-privezti-avto-iz-kitaya-2026.html', import.meta.url), 'utf8')
  const deliveryPage = fs.readFileSync(new URL('../../site/dostavka.html', import.meta.url), 'utf8')

  assert.match(costArticle, /href="\/dostavka\.html">Рассчитать стоимость доставки автомобиля из Китая<\/a>/)
  assert.match(deliveryPage, /href="\/blog\/skolko-stoit-privezti-avto-iz-kitaya-2026\.html"/)
})

test('EREV and PHEV article links to existing hybrid cards from the site root', () => {
  const article = fs.readFileSync(new URL('../../site/blog/erev-vs-phev.html', import.meta.url), 'utf8')
  const slugs = ['lixiang-l7', 'lixiang-l9', 'voyah-free', 'aito-m7', 'byd-song-plus']

  for (const slug of slugs) {
    assert.match(article, new RegExp(`href="/cars/${slug}\\.html"`))
    assert.ok(fs.existsSync(new URL(`../../site/cars/${slug}.html`, import.meta.url)))
  }
  assert.doesNotMatch(article, /href="cars\//)
})

test('geo pages replace legacy model links with the live API catalog', () => {
  const script = fs.readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8')

  assert.match(script, /A\.CATALOG_FROM_API = true/)
  assert.match(script, /function renderGeoCatalog\(\)/)
  assert.match(script, /A\.CARS\.slice\(0, 6\)\.map\(A\.carCard\)/)
  assert.match(script, /renderGeoCatalog\(\)/)
})

test('delivery search snippet matches the cost query and visible page content', () => {
  const page = fs.readFileSync(new URL('../../site/dostavka.html', import.meta.url), 'utf8')

  assert.match(page, /<title>Стоимость доставки автомобиля из Китая в Россию \| INAVTO ASIA<\/title>/)
  assert.match(page, /<meta name="description" content="Узнайте, из чего складывается стоимость доставки автомобиля из Китая:/)
  assert.match(page, /<h1 class="h1">Стоимость доставки автомобиля из Китая в Россию<\/h1>/)
  assert.equal((page.match(/<h1\b/g) || []).length, 1)
  assert.match(page, /<link rel="canonical" href="https:\/\/inavtoasia\.ru\/dostavka\.html">/)
  assert.doesNotMatch(page, /noindex/i)
  assert.doesNotMatch(page, /(?:180 000|200 000|40–60|70 000|до рубля)/)
})

test('delivery page exposes matching FAQ and breadcrumb structured data', () => {
  const page = fs.readFileSync(new URL('../../site/dostavka.html', import.meta.url), 'utf8')
  const jsonLd = [...page.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
  const faq = jsonLd.find((item) => item['@type'] === 'FAQPage')
  const breadcrumbs = jsonLd.find((item) => item['@type'] === 'BreadcrumbList')

  assert.ok(faq)
  assert.equal(faq.mainEntity.length, 8)
  assert.equal((page.match(/class="faq-item"/g) || []).length, 8)
  faq.mainEntity.forEach((item) => {
    assert.ok(page.includes(item.name))
    assert.ok(page.includes(item.acceptedAnswer.text))
  })
  assert.equal(breadcrumbs.itemListElement.at(-1).item, 'https://inavtoasia.ru/dostavka.html')
})

test('delivery form collects the approved calculation details', () => {
  const page = fs.readFileSync(new URL('../../site/dostavka.html', import.meta.url), 'utf8')
  const script = fs.readFileSync(new URL('../../site/js/main.js', import.meta.url), 'utf8')

  assert.match(page, /data-lead-form="Расчёт стоимости доставки"/)
  for (const field of ['name', 'phone', 'car', 'trim', 'city', 'comment']) {
    assert.match(page, new RegExp(`name="${field}"`))
  }
  assert.match(script, /Автомобиль: /)
  assert.match(script, /Комплектация: /)
  assert.match(page, /<!-- GEO-LINKS:START -->[\s\S]*<!-- GEO-LINKS:END -->/)
})
