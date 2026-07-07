/**
 * Генератор статических SEO-страниц моделей: node build-pages.mjs
 * Читает js/data.js → пишет cars/<slug>.html, sitemap.xml, robots.txt.
 * Запускать после любого изменения каталога.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DOMAIN = 'https://inavto.asia' // заменить на реальный домен перед запуском

const win = {}
new Function('window', fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8'))(win)
const { CARS } = win.INAVTO

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const priceRub = (m) => Math.round(m * 1_000_000)
const fmtPrice = (m) => m.toFixed(1).replace('.', ',')

function pageHTML(car) {
  const from = 'из Китая'
  const catUrl = 'catalog.html'
  const catName = 'Авто из Китая'
  const stateNote = 'новый автомобиль'
  const title = `${car.name} купить под заказ ${from} — цена под ключ | INAVTO ASIA`
  const desc = `${car.name} (${car.body.toLowerCase()}, ${car.fuel.toLowerCase()}, ${car.power}) под заказ ${from} с доставкой под ключ в Россию: от ${fmtPrice(car.price)} млн ₽ с растаможкой, СБКТС и гарантиями по договору. Срок 30–60 дней.`

  const specs = [
    ['Кузов', car.body], ['Двигатель', car.fuel], ['Мощность', car.power], ['Привод', car.drive],
  ]
  if (car.range !== '—') specs.push(['Запас хода', car.range])
  if (car.battery !== '—') specs.push(['Батарея', car.battery])
  specs.push(['Состояние', stateNote])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: car.name,
    description: desc,
    brand: { '@type': 'Brand', name: car.brand },
    category: car.body,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: priceRub(car.price),
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/PreOrder',
      url: `${DOMAIN}/cars/${car.slug}.html`,
    },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${DOMAIN}/` },
      { '@type': 'ListItem', position: 2, name: catName, item: `${DOMAIN}/${catUrl}` },
      { '@type': 'ListItem', position: 3, name: car.name },
    ],
  }

  const similar = CARS
    .filter((c) => c.slug !== car.slug && c.country === car.country && (c.body === car.body || c.brand === car.brand))
    .slice(0, 3)

  const faq = [
    [`Сколько стоит ${car.name} под ключ?`,
      `От ${fmtPrice(car.price)} млн ₽ — уже с логистикой, таможенной пошлиной, утильсбором, СБКТС/ЭПТС и нашей комиссией. Точная цена зависит от комплектации и вашего города — пришлём расчёт по заявке в течение дня.`],
    [`Какой срок доставки ${car.name} ${from}?`,
      'Полный цикл — 40–60 дней: выкуп и проверка, доставка автовозом/ж-д или морем, растаможка, СБКТС и выдача. Срок фиксируется в договоре.'],
    ['Какие гарантии при заказе?',
      'Договор с фиксацией цены и сроков, оплата продавцу по банковскому инвойсу, проверка автомобиля до выкупа с фото/видео-отчётом, страхование груза на весь путь.'],
  ]
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({
      '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="../">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${DOMAIN}/cars/${car.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Unbounded:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="img/favicon.svg">
  <link rel="stylesheet" href="css/style.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head>
<body data-page="car">

  <section class="page-hero" style="padding-bottom:24px">
    <div class="container">
      <div class="breadcrumbs"><a href="index.html">Главная</a> / <a href="${catUrl}">${catName}</a> / ${esc(car.name)}</div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="calc-layout">
        <div>
          <div data-car-visual="${car.slug}"></div>
          <h1 class="h2" style="margin:22px 0 8px">${esc(car.name)} под заказ ${from}</h1>
          <p class="lead" style="font-size:16px">${esc(car.desc)}</p>
          <div class="calc-panel" style="margin-top:22px">
            ${specs.map(([k, v]) => `<div class="calc-row"><span>${k}</span><b>${esc(v)}</b></div>`).join('\n            ')}
          </div>
          <div style="margin-top:28px">
            ${faq.map(([q, a]) => `<div class="faq-item"><button class="faq-q">${esc(q)}</button><div class="faq-a">${esc(a)}</div></div>`).join('\n            ')}
          </div>
        </div>
        <div class="calc-panel calc-result reveal">
          <div class="badge badge-green" style="margin-bottom:14px">доступен к заказу</div>
          <div class="muted" style="font-size:13.5px">Цена «под ключ» с доставкой и растаможкой</div>
          <div class="calc-total" style="padding-top:6px"><span></span><b>от ${fmtPrice(car.price)} млн ₽</b></div>
          <div class="calc-row"><span>Срок доставки</span><b>30–60 дней</b></div>
          <div class="calc-row"><span>Фиксация цены</span><b>в договоре</b></div>
          <div class="calc-row" style="border:none"><span>Оплата</span><b>по инвойсу через банк</b></div>
          <form class="form-grid" data-lead-form="Заявка на ${esc(car.name)}" data-brand="${esc(car.name)}" style="margin-top:18px">
            <div class="form-field"><input name="name" placeholder="Ваше имя" required></div>
            <div class="form-field"><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required></div>
            <button class="btn btn-red btn-block" type="submit">Узнать точную цену</button>
            <div class="form-note">Пришлём актуальный расчёт с учётом комплектации и вашего города. Нажимая кнопку, вы соглашаетесь с <a href="privacy.html">политикой конфиденциальности</a>.</div>
          </form>
        </div>
      </div>
    </div>
  </section>

  ${similar.length ? `<section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head"><h2 class="h2">Похожие автомобили</h2></div>
      <div class="cars-grid" data-similar="${similar.map((c) => c.slug).join(',')}"></div>
    </div>
  </section>` : ''}

  <script src="js/data.js"></script>
  <script src="js/i18n.js"></script>
  <script>
    window.INAVTO_PAGE_INIT = function () {
      var A = window.INAVTO;
      document.querySelectorAll('[data-car-visual]').forEach(function (el) {
        var car = A.CARS.find(function (c) { return c.slug === el.dataset.carVisual; });
        if (car) el.outerHTML = A.carVisual(car);
      });
      var sim = document.querySelector('[data-similar]');
      if (sim) sim.innerHTML = sim.dataset.similar.split(',')
        .map(function (s) { return A.CARS.find(function (c) { return c.slug === s; }); })
        .filter(Boolean).map(A.carCard).join('');
    };
  </script>
  <script src="js/main.js"></script>
</body>
</html>
`
}

const outDir = path.join(ROOT, 'cars')
fs.mkdirSync(outDir, { recursive: true })
for (const car of CARS) {
  fs.writeFileSync(path.join(outDir, `${car.slug}.html`), pageHTML(car))
}

const staticPages = ['', 'catalog.html', 'calculator.html', 'kak-my-rabotaem.html',
  'garantii.html', 'dostavka.html', 'dlya-biznesa.html', 'o-kompanii.html', 'kontakty.html']
const urls = [
  ...staticPages.map((p) => `${DOMAIN}/${p}`),
  ...CARS.map((c) => `${DOMAIN}/cars/${c.slug}.html`),
]
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /car.html\nSitemap: ${DOMAIN}/sitemap.xml\n`)

console.log(`OK: ${CARS.length} model pages, sitemap.xml (${urls.length} URLs), robots.txt`)
