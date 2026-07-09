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
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
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


/* ================= ГЕО-СТРАНИЦЫ «Авто из Китая в {город}» ================= */

const CITIES = [
  ['moskva', 'Москва', 'в Москве', 'west'],
  ['sankt-peterburg', 'Санкт-Петербург', 'в Санкт-Петербурге', 'west'],
  ['novosibirsk', 'Новосибирск', 'в Новосибирске', 'siberia'],
  ['ekaterinburg', 'Екатеринбург', 'в Екатеринбурге', 'ural'],
  ['kazan', 'Казань', 'в Казани', 'west'],
  ['nizhniy-novgorod', 'Нижний Новгород', 'в Нижнем Новгороде', 'west'],
  ['krasnoyarsk', 'Красноярск', 'в Красноярске', 'siberia'],
  ['chelyabinsk', 'Челябинск', 'в Челябинске', 'ural'],
  ['samara', 'Самара', 'в Самаре', 'west'],
  ['ufa', 'Уфа', 'в Уфе', 'ural'],
  ['rostov-na-donu', 'Ростов-на-Дону', 'в Ростове-на-Дону', 'west'],
  ['omsk', 'Омск', 'в Омске', 'siberia'],
  ['krasnodar', 'Краснодар', 'в Краснодаре', 'west'],
  ['voronezh', 'Воронеж', 'в Воронеже', 'west'],
  ['perm', 'Пермь', 'в Перми', 'ural'],
  ['volgograd', 'Волгоград', 'в Волгограде', 'west'],
  ['saratov', 'Саратов', 'в Саратове', 'west'],
  ['tyumen', 'Тюмень', 'в Тюмени', 'ural'],
  ['tolyatti', 'Тольятти', 'в Тольятти', 'west'],
  ['izhevsk', 'Ижевск', 'в Ижевске', 'ural'],
  ['barnaul', 'Барнаул', 'в Барнауле', 'siberia'],
  ['irkutsk', 'Иркутск', 'в Иркутске', 'siberia'],
  ['khabarovsk', 'Хабаровск', 'в Хабаровске', 'fareast'],
  ['vladivostok', 'Владивосток', 'во Владивостоке', 'fareast'],
  ['yaroslavl', 'Ярославль', 'в Ярославле', 'west'],
  ['kemerovo', 'Кемерово', 'в Кемерове', 'siberia'],
  ['novokuznetsk', 'Новокузнецк', 'в Новокузнецке', 'siberia'],
  ['tomsk', 'Томск', 'в Томске', 'siberia'],
  ['orenburg', 'Оренбург', 'в Оренбурге', 'ural'],
  ['surgut', 'Сургут', 'в Сургуте', 'ural'],
  ['chita', 'Чита', 'в Чите', 'fareast'],
  ['ulan-ude', 'Улан-Удэ', 'в Улан-Удэ', 'fareast'],
]

const REGION = {
  fareast: {
    term: '25–45 дней',
    route: 'Ваш регион — ближайший к Китаю: автомобили заезжают через Забайкальск или приходят морем во Владивосток, без длинного плеча по России. Отсюда и самые короткие сроки.',
  },
  siberia: {
    term: '30–50 дней',
    route: 'Сибирь стоит на основном маршруте из Китая: автомобиль пересекает границу в Забайкальске или Хоргосе и едет к вам железной дорогой либо автовозом.',
  },
  ural: {
    term: '35–55 дней',
    route: 'До Урала автомобили идут через Хоргос или Забайкальск железной дорогой и автовозом — маршрут отработанный, сроки предсказуемые.',
  },
  west: {
    term: '40–60 дней',
    route: 'В европейскую часть России автомобили привозим железной дорогой или автовозом через Забайкальск/Хоргос; для юга Китая часто выгоднее морем до Владивостока и далее по ж-д.',
  },
}

const GEO_INTROS = [
  (c) => `Привозим новые автомобили из Китая ${c[2]} «под ключ»: выкуп, проверка, логистика, растаможка, СБКТС и вручение с полным пакетом документов. Цена и срок фиксируются в договоре до старта работы.`,
  (c) => `Подбираем и доставляем новые автомобили из Китая ${c[2]}: электромобили, гибриды и бензиновые модели. Берём на себя весь цикл — от поиска на китайских площадках до выдачи с документами, готовыми для ГИБДД.`,
  (c) => `Новые авто из Китая с доставкой ${c[2]} — с фиксацией цены в договоре, оплатой по банковскому инвойсу и фотоотчётами на каждом этапе пути. Растаможка и сертификация — полностью на нас.`,
]

function geoHTML(city, i) {
  const [slug, name, inCity, regionKey] = city
  const region = REGION[regionKey]
  const title = `Авто из Китая ${inCity} — под заказ с доставкой под ключ | INAVTO ASIA`
  const desc = `Новые автомобили из Китая под заказ с доставкой ${inCity}: фиксированная цена в договоре, растаможка, СБКТС/ЭПТС, срок ${region.term}. Комиссия 70 000 ₽, расчёт под ключ за день.`
  const intro = GEO_INTROS[i % GEO_INTROS.length](city)

  const faq = [
    [`Сколько ехать автомобилю из Китая ${inCity}?`,
      `Ориентировочно ${region.term} с момента выкупа. ${region.route} Максимальный срок фиксируется в договоре.`],
    [`Как проходит выдача ${inCity}?`,
      `Автомобиль передаём лично в руки или автовозом до вашего адреса — с полным пакетом документов: договор, инвойсы, таможенные квитанции, СБКТС и электронный ПТС. Поможем с постановкой на учёт.`],
    [`Сколько стоит доставка ${inCity}?`,
      `Логистика и все платежи считаются заранее и входят в смету «под ключ» — воспользуйтесь калькулятором на сайте или оставьте заявку: пришлём точный расчёт для вашего города в течение дня.`],
  ]
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${DOMAIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Доставка и растаможка', item: `${DOMAIN}/dostavka.html` },
      { '@type': 'ListItem', position: 3, name: name },
    ],
  }

  const others = CITIES.filter((c) => c[0] !== slug).slice(0, 14)
  const topSlugs = CARS.slice(0, 6).map((c) => c.slug).join(',')

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="../">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${DOMAIN}/gorod/${slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="img/favicon.svg">
  <link rel="stylesheet" href="css/style.css">
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</head>
<body data-page="geo">

  <section class="page-hero">
    <div class="container">
      <div class="breadcrumbs"><a href="index.html">Главная</a> / <a href="dostavka.html">Доставка</a> / ${esc(name)}</div>
      <h1 class="h1">Авто из Китая <span class="accent">${esc(inCity)}</span></h1>
      <p class="lead" style="margin-top:14px;max-width:720px">${esc(intro)}</p>
      <div class="hero-actions" style="margin-top:32px">
        <button class="btn btn-red" data-quiz-open>Подобрать автомобиль</button>
        <a class="btn btn-ghost" href="calculator.html">Рассчитать цену под ключ</a>
      </div>
      <div class="hero-stats">
        <div><b class="num">${region.term}</b><span>доставка ${esc(inCity)}</span></div>
        <div><b class="num">70 000 ₽</b><span>фиксированная комиссия</span></div>
        <div><b class="num">1–2 дня</b><span>выкуп после вашего «да»</span></div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:16px">
    <div class="container">
      <div class="section-head">
        <div class="divider-label">Маршрут</div>
        <h2 class="h2" style="margin-top:14px">Как мы доставляем ${esc(inCity)}</h2>
        <p class="lead">${esc(region.route)}</p>
      </div>
      <div class="grid grid-3">
        <div class="feature reveal"><h3>Логистика и страховка</h3><p>Автовоз, железная дорога или море — маршрут подбираем под задачу. Груз застрахован на весь путь, фото с погрузки и статусы приходят в Telegram.</p></div>
        <div class="feature reveal"><h3>Растаможка по пути</h3><p>Пошлина, таможенный сбор, утильсбор, СБКТС и электронный ПТС — оформляем сами, по официальным квитанциям, которые вы видите.</p></div>
        <div class="feature reveal"><h3>Выдача ${esc(inCity)}</h3><p>Передаём автомобиль с полным пакетом документов — лично в руки или автовозом до адреса. Помогаем с постановкой на учёт в ГИБДД.</p></div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head">
        <div class="divider-label">Каталог</div>
        <h2 class="h2" style="margin-top:14px">Популярные модели под заказ</h2>
        <p class="lead">Цены «под ключ» — с логистикой, таможней и нашей комиссией. Привезём и любую другую модель с рынка Китая.</p>
      </div>
      <div class="cars-grid" data-geo-cars="${topSlugs}"></div>
      <div style="text-align:center;margin-top:36px"><a class="btn btn-white" href="catalog.html">Открыть весь каталог</a></div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head"><h2 class="h2">Частые вопросы</h2></div>
      <div style="max-width:820px">
        ${faq.map(([q, a]) => `<div class="faq-item"><button class="faq-q">${esc(q)}</button><div class="faq-a">${esc(a)}</div></div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="divider-label" style="margin-bottom:22px">Другие города</div>
      <div class="geo-links">
        ${others.map((c) => `<a href="gorod/${c[0]}.html">${esc(c[1])}</a>`).join('\n        ')}
        <a href="dostavka.html"><b>Все города →</b></a>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="cta-banner reveal">
        <div>
          <h2 class="h2">Начнём с бесплатного подбора</h2>
          <p class="lead">Ответьте на 4 вопроса — пришлём 3–5 подходящих вариантов с расчётом «под ключ» до вашего города.</p>
        </div>
        <div class="cta-banner-actions">
          <button class="btn btn-red" data-quiz-open>Подобрать авто</button>
          <a class="btn btn-ghost" href="kontakty.html">Контакты</a>
        </div>
      </div>
    </div>
  </section>

  <script src="js/data.js"></script>
  <script src="js/i18n.js"></script>
  <script>
    window.INAVTO_PAGE_INIT = function () {
      var A = window.INAVTO;
      var grid = document.querySelector('[data-geo-cars]');
      if (grid) grid.innerHTML = grid.dataset.geoCars.split(',')
        .map(function (s) { return A.CARS.find(function (c) { return c.slug === s; }); })
        .filter(Boolean).map(A.carCard).join('');
    };
  </script>
  <script src="js/main.js"></script>
</body>
</html>
`
}

const geoDir = path.join(ROOT, 'gorod')
fs.mkdirSync(geoDir, { recursive: true })
CITIES.forEach((city, i) => {
  fs.writeFileSync(path.join(geoDir, `${city[0]}.html`), geoHTML(city, i))
})

/* Хаб городов на странице «Доставка» — блок между маркерами */
const dostavkaPath = path.join(ROOT, 'dostavka.html')
let dostavka = fs.readFileSync(dostavkaPath, 'utf8')
const hub = `<!-- GEO-LINKS:START -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head">
        <div class="divider-label">География</div>
        <h2 class="h2" style="margin-top:14px">Доставка по городам</h2>
      </div>
      <div class="geo-links">
        ${CITIES.map((c) => `<a href="gorod/${c[0]}.html">${esc(c[1])}</a>`).join('\n        ')}
      </div>
    </div>
  </section>
  <!-- GEO-LINKS:END -->`
if (dostavka.includes('<!-- GEO-LINKS:START -->')) {
  dostavka = dostavka.replace(/<!-- GEO-LINKS:START -->[\s\S]*?<!-- GEO-LINKS:END -->/, hub)
  fs.writeFileSync(dostavkaPath, dostavka)
}

const staticPages = ['', 'catalog.html', 'calculator.html', 'kak-my-rabotaem.html',
  'garantii.html', 'dostavka.html', 'dlya-biznesa.html', 'vydannye-avto.html', 'o-kompanii.html', 'kontakty.html']
const urls = [
  ...staticPages.map((p) => `${DOMAIN}/${p}`),
  ...CARS.map((c) => `${DOMAIN}/cars/${c.slug}.html`),
  ...CITIES.map((c) => `${DOMAIN}/gorod/${c[0]}.html`),
  `${DOMAIN}/blog/`,
  `${DOMAIN}/blog/utilsbor-2026.html`,
  `${DOMAIN}/blog/erev-vs-phev.html`,
  `${DOMAIN}/blog/kak-proverit-posrednika.html`,
]
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /car.html\nSitemap: ${DOMAIN}/sitemap.xml\n`)

console.log(`OK: ${CARS.length} model pages, ${CITIES.length} geo pages, sitemap.xml (${urls.length} URLs), robots.txt`)
