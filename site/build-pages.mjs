/**
 * Генератор статических SEO-страниц моделей: node build-pages.mjs
 * Читает js/data.js → пишет cars/<slug>.html, sitemap.xml, robots.txt.
 * Запускать после любого изменения каталога.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DOMAIN = 'https://inavtoasia.ru' // боевой домен

const win = {}
new Function('window', fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8'))(win)
/* специи-карточка: тот же код, что и на сайте — вёрстка не расходится */
new Function('window', fs.readFileSync(path.join(ROOT, 'js/specs.js'), 'utf8'))(win)
const { CARS } = win.INAVTO

/* Даты для разметки товара: цена действует с сегодняшнего дня на год вперёд */
const TODAY = new Date().toISOString().slice(0, 10)
const PRICE_VALID_UNTIL = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const priceRub = (m) => Math.round(m * 1_000_000)
const fmtPrice = (m) => m.toFixed(1).replace('.', ',')

const CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
const CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'

/* Статичная галерея для SEO/до загрузки JS. JS затем заменит её на A.carGallery
   (подхватит актуальные фото из каталога-API). Совпадает по разметке с A.carGallery. */
function galleryStaticHTML(car) {
  const grad = `linear-gradient(155deg, ${car.grad[0]}, ${car.grad[1]})`
  const photos = Array.isArray(car.photos) ? car.photos : []
  const main = photos.length ? `<img class="cg-main-img" src="${photos[0]}" alt="${esc(car.name)}">` : ''
  const multi = photos.length > 1
  const nav = multi
    ? `<button class="cg-nav cg-prev" data-gallery-prev aria-label="Предыдущее фото">${CHEV_L}</button><button class="cg-nav cg-next" data-gallery-next aria-label="Следующее фото">${CHEV_R}</button><span class="cg-count"><b>1</b> / ${photos.length}</span>`
    : ''
  const thumbs = multi
    ? '<div class="cg-thumbs">' + photos.map((p, i) => `<button class="cg-thumb${i === 0 ? ' active' : ''}" data-gallery-thumb="${i}" style="background-image:url('${p}')" aria-label="Фото ${i + 1}"></button>`).join('') + '</div>'
    : ''
  return `<div class="car-gallery" data-gallery><div class="cg-main" style="background:${grad}"><span class="cg-brand">${esc(car.brand)}</span><span class="cg-flag">China</span>${main}${nav}</div>${thumbs}</div>`
}

function pageHTML(car, allCars) {
  /* Список для блока «Похожие»: из базы каталога, если страницу строит
     бэкенд, иначе — встроенный в data.js */
  const list = Array.isArray(allCars) && allCars.length ? allCars : CARS
  const from = 'из Китая'
  const catUrl = 'catalog.html'
  const catName = 'Авто из Китая'
  const used = car.cond === 'used'
  const stock = !!car.stock
  const city = String(car.stockCity || '').trim()
  const title = stock
    ? `${car.name} в наличии в России${city ? ' — ' + city : ''} — купить | INAVTO ASIA`
    : `${car.name} купить под заказ ${from} — цена под ключ | INAVTO ASIA`
  const desc = stock
    ? `${car.name} (${car.body.toLowerCase()}, ${car.fuel.toLowerCase()}, ${car.power}) — уже в России${city ? ', ' + city : ''}: растаможен, с документами, цена ${fmtPrice(car.price)} млн ₽. Можно осмотреть и забрать сегодня.`
    : `${car.name} (${car.body.toLowerCase()}, ${car.fuel.toLowerCase()}, ${car.power}) под заказ ${from} с доставкой под ключ в Россию: от ${fmtPrice(car.price)} млн ₽ с растаможкой, СБКТС и гарантиями по договору. Срок 30–60 дней.`

  const specs = [['Мощность', car.power], ['Привод', car.drive]]
  if (car.range !== '—') specs.push(['Запас хода', car.range])
  if (car.battery !== '—') specs.push(['Батарея', car.battery])
  if ((used || stock) && car.mileage) specs.push(['Пробег', Number(car.mileage).toLocaleString('ru-RU') + ' км'])
  specs.push(['Год', String(car.year)])
  if (stock) {
    specs.unshift(['Город', city || 'Россия'])
    if (car.vin) specs.push(['VIN', car.vin])
  }

  const pills = `<div class="car-pills"><span>${esc(car.body)}</span><span>${esc(car.fuel)}</span><span>${car.year}</span><span class="${used ? 'state-used' : 'state-new'}">${used ? 'С пробегом' : 'Новый'}</span></div>`
  const specSheet = win.INAVTO.specSheetHTML(car, car.desc)
  const specGrid = '<div class="spec-grid">' + specs.map(([k, v]) => `<div class="spec-item"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('') + '</div>'
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  const cnyLine = car.priceCny ? `<div class="price-cny">≈ ¥ ${car.priceCny.toLocaleString('ru-RU')} цена в Китае</div>` : ''

  /* Разметка товара для Google. Обязательное поле image: фото модели,
     если оно есть в каталоге, иначе фирменное изображение сайта. */
  const photo = Array.isArray(car.photos) && car.photos[0] ? car.photos[0] : ''
  const imageUrl = photo
    ? (/^https?:/.test(photo) ? photo : `${DOMAIN}${photo.startsWith('/') ? '' : '/'}${photo}`)
    : `${DOMAIN}/img/og-image.jpg`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: car.name,
    description: desc,
    image: [imageUrl],
    brand: { '@type': 'Brand', name: car.brand },
    /* категория из товарной таксономии Google — свободный текст она не принимает */
    category: 'Vehicles & Parts > Vehicles > Motor Vehicles > Cars, Trucks & Vans',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: priceRub(car.price),
      validFrom: TODAY,
      priceValidUntil: PRICE_VALID_UNTIL,
      itemCondition: used ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
      availability: stock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      url: `${DOMAIN}/cars/${car.slug}.html`,
      seller: { '@type': 'Organization', name: 'INAVTO ASIA' },
      /* доставка входит в цену «под ключ», срок 30–60 дней по России */
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'RUB' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'RU' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 30, maxValue: 60, unitCode: 'DAY' },
        },
      },
      /* автомобиль привозится под конкретный заказ: возврат после выдачи
         не предусмотрен (условия отказа до выкупа — в договоре) */
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'RU',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      },
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

  /* Похожие: сначала та же марка или тип кузова, добиваем ближайшими по цене —
     чтобы на каждой странице каталога были живые ссылки на соседние. */
  const others = list.filter((c) => c.slug !== car.slug)
  const similar = others.filter((c) => c.body === car.body || c.brand === car.brand).slice(0, 3)
  if (similar.length < 3) {
    const byPrice = others
      .filter((c) => !similar.includes(c))
      .sort((a, b) => Math.abs(a.price - car.price) - Math.abs(b.price - car.price))
    similar.push(...byPrice.slice(0, 3 - similar.length))
  }

  const faq = stock ? [
    [`Сколько стоит ${car.name}?`,
      `${fmtPrice(car.price)} млн ₽. Автомобиль уже в России, растаможен, утильсбор оплачен — доплат за логистику и таможню не будет.`],
    [`Можно ли посмотреть ${car.name} перед покупкой?`,
      `Да. Автомобиль находится ${city ? 'в городе ' + city : 'в России'} — договоримся об осмотре в удобное время, покажем автомобиль и документы.`],
    ['Какие документы передаются с автомобилем?',
      'Договор купли-продажи, таможенные документы, СБКТС и электронный ПТС — полный пакет, готовый для постановки на учёт в ГИБДД.'],
  ] : [
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
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="INAVTO ASIA">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${DOMAIN}/cars/${car.slug}.html">
  <meta property="og:image" content="${DOMAIN}/img/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="icon" href="favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="img/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32.png">
  <link rel="apple-touch-icon" href="img/apple-touch-icon.png">
  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.INAVTO_YM_ID = 111046600;
    ym(111046600, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/111046600" style="position:absolute; left:-9999px;" alt=""></div></noscript>
  <!-- /Yandex.Metrika counter -->
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
          <div data-car-gallery="${car.slug}">${galleryStaticHTML(car)}</div>
          <h1 class="h2" style="margin:22px 0 4px">${esc(car.name)} ${stock ? 'в наличии в России' : 'под заказ ' + from}</h1>
          ${pills}
          ${specSheet || `<p class="lead" style="font-size:16px;margin-top:12px">${esc(car.desc)}</p>
          <div class="divider-label" style="margin:28px 0 14px">Характеристики</div>
          ${specGrid}`}
          <div style="margin-top:32px">
            ${faq.map(([q, a]) => `<div class="faq-item"><button class="faq-q">${esc(q)}</button><div class="faq-a">${esc(a)}</div></div>`).join('\n            ')}
          </div>
        </div>
        <div class="calc-panel calc-result reveal">
          <div class="badge badge-green" style="margin-bottom:14px">${stock ? 'в наличии — можно забрать сегодня' : 'доступен к заказу'}</div>
          <div class="muted" style="font-size:13.5px">${stock ? 'Цена — автомобиль уже в России' : 'Цена «под ключ» с доставкой и растаможкой'}</div>
          <div class="calc-total" style="padding-top:6px"><span></span><b>от ${fmtPrice(car.price)} млн ₽</b></div>
          ${cnyLine}
          ${stock
    ? `<div class="calc-row" style="margin-top:14px"><span>Срок передачи</span><b>сегодня</b></div>
          <div class="calc-row"><span>Где находится</span><b>${esc(city || 'Россия')}</b></div>`
    : `<div class="calc-row" style="margin-top:14px"><span>Срок доставки</span><b>30–60 дней</b></div>
          <div class="calc-row"><span>Фиксация цены</span><b>в договоре</b></div>`}
          <div class="calc-row" style="border:none"><span>Оплата</span><b>по инвойсу через банк</b></div>
          <form class="form-grid" data-lead-form="${stock ? 'Бронь: ' : 'Заявка на '}${esc(car.name)}" data-brand="${esc(car.name)}" style="margin-top:18px">
            <div class="form-field"><input name="name" placeholder="Ваше имя" required></div>
            <div class="form-field"><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required></div>
            <button class="btn btn-red btn-block" type="submit">${stock ? 'Забронировать' : 'Узнать точную цену'}</button>
            <div class="form-note">${stock ? 'Закрепим автомобиль за вами и свяжемся в ближайшее время.' : 'Пришлём актуальный расчёт с учётом комплектации и вашего города.'} Нажимая кнопку, вы соглашаетесь с <a href="privacy.html">политикой конфиденциальности</a>.</div>
          </form>
          <div class="price-trust">
            <span>${CHECK}Договор с фиксацией цены и сроков</span>
            <span>${CHECK}Страхование груза на весь путь</span>
            <span>${CHECK}Проверка автомобиля до оплаты</span>
          </div>
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
  <script src="js/specs.js"></script>
  <script src="js/i18n.js"></script>
  <script>
    window.INAVTO_PAGE_INIT = function () {
      var A = window.INAVTO;
      document.querySelectorAll('[data-car-gallery]').forEach(function (el) {
        var car = A.CARS.find(function (c) { return c.slug === el.dataset.carGallery; });
        if (car) el.outerHTML = A.carGallery(car);
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
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="INAVTO ASIA">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${DOMAIN}/gorod/${slug}.html">
  <meta property="og:image" content="${DOMAIN}/img/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="icon" href="favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="img/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="img/favicon-32.png">
  <link rel="apple-touch-icon" href="img/apple-touch-icon.png">
  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.INAVTO_YM_ID = 111046600;
    ym(111046600, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/111046600" style="position:absolute; left:-9999px;" alt=""></div></noscript>
  <!-- /Yandex.Metrika counter -->
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

/* ---------------------------------------------------------------
   Экспорт для сервера: бэкенд генерирует страницы машин из базы
   (каталог админки), используя ровно тот же шаблон, что и здесь.
   --------------------------------------------------------------- */
export { pageHTML as carPageHTML, geoHTML, CITIES, DOMAIN }

export const STATIC_PAGES = ['', 'catalog.html', 'calculator.html', 'kak-my-rabotaem.html',
  'garantii.html', 'dostavka.html', 'dlya-biznesa.html', 'vydannye-avto.html', 'o-kompanii.html',
  'kontakty.html', 'rekvizity.html']

export const BLOG_URLS = [
  'blog/',
  'blog/lixiang-l7-ili-l9.html',
  'blog/skolko-stoit-privezti-avto-iz-kitaya-2026.html',
  'blog/utilsbor-2026.html',
  'blog/erev-vs-phev.html',
  'blog/kak-proverit-posrednika.html',
]

/* Карта сайта: статические страницы + переданные слаги машин + города + блог */
export function sitemapXML(carSlugs) {
  const urls = [
    ...STATIC_PAGES.map((p) => `${DOMAIN}/${p}`),
    ...carSlugs.map((slug) => `${DOMAIN}/cars/${slug}.html`),
    ...CITIES.map((c) => `${DOMAIN}/gorod/${c[0]}.html`),
    ...BLOG_URLS.map((u) => `${DOMAIN}/${u}`),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`
}

export const robotsTxt = () =>
  `User-agent: *\nAllow: /\nDisallow: /car.html\nSitemap: ${DOMAIN}/sitemap.xml\n`

/* ---------------- Сборка из командной строки (локально) ---------------- */
function buildAll() {
  const outDir = path.join(ROOT, 'cars')
  fs.mkdirSync(outDir, { recursive: true })
  for (const car of CARS) {
    fs.writeFileSync(path.join(outDir, `${car.slug}.html`), pageHTML(car))
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

  const slugs = CARS.map((c) => c.slug)
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXML(slugs))
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robotsTxt())
  console.log(`OK: ${CARS.length} model pages, ${CITIES.length} geo pages, sitemap.xml, robots.txt`)
}

/* Запуск напрямую (node build-pages.mjs), а не импорт из бэкенда */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) buildAll()
