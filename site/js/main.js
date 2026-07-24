/* INAVTO ASIA — общий скрипт: layout, квиз, каталог, формы */
(function () {
  const A = window.INAVTO;
  const C = A.CONTACTS;
  // Backend Express (тот же, что у Telegram Mini App). Пусто = same-origin /api.
  const API_BASE = window.INAVTO_API || '';

  /* Цели Яндекс.Метрики: задать window.INAVTO_YM_ID = <номер счётчика> */
  A.goal = function (name) {
    try {
      if (typeof window.ym === 'function' && window.INAVTO_YM_ID) {
        window.ym(window.INAVTO_YM_ID, 'reachGoal', name);
      }
    } catch (e) { /* аналитика не должна ломать сайт */ }
  };

  /* ---------- SVG-иконки ---------- */
  const ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 18.8 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.6L18 6.9c.4-.3-.1-.5-.6-.2L7.1 13.2l-4.5-1.4c-1-.3-1-1 .2-1.4l17.7-6.8c.8-.3 1.5.2 1.4 1z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.4 14.1c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.2 2.4 1.5 2.7 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  };
  A.ICONS = ICONS;

  /* ---------- Избранное (localStorage) ---------- */
  const FAV_KEY = 'inavto_favs';
  const favList = () => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  };
  A.favs = {
    list: favList,
    has: (slug) => favList().includes(slug),
    toggle(slug) {
      let l = favList();
      if (l.includes(slug)) l = l.filter(x => x !== slug);
      else { l.push(slug); A.goal('fav_add'); }
      try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch (e) { /* — */ }
      document.dispatchEvent(new CustomEvent('inavto:favs'));
      return l;
    },
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    A.favs.toggle(b.dataset.fav);
    document.querySelectorAll('[data-fav="' + b.dataset.fav + '"]').forEach(x =>
      x.classList.toggle('on', A.favs.has(b.dataset.fav)));
  });

  /* ---------- Layout: шапка ---------- */
  const page = document.body.dataset.page || '';
  const navLinks = [
    ['catalog.html', 'Каталог', 'catalog'],
    ['calculator.html', 'Калькулятор', 'calculator'],
    ['kak-my-rabotaem.html', 'Как мы работаем', 'process'],
    ['garantii.html', 'Гарантии', 'garantii'],
    ['dlya-biznesa.html', 'Для бизнеса', 'dlya-biznesa'],
    ['kontakty.html', 'Контакты', 'kontakty'],
  ];

  function renderHeader() {
    const nav = navLinks.map(([href, label, key]) =>
      `<a href="${href}"${key === page ? ' class="active"' : ''}>${label}</a>`).join('');
    const curLang = (window.INAVTO_I18N && window.INAVTO_I18N.lang) || 'ru';
    const langHtml = '<div class="lang-switch" role="group" aria-label="Язык сайта">' +
      [['ru', 'Рус'], ['zh', '中文'], ['en', 'EN']].map(([code, label]) =>
        `<button type="button" data-lang="${code}"${code === curLang ? ' class="on"' : ''} lang="${code === 'ru' ? 'ru' : code === 'zh' ? 'zh-CN' : 'en'}">${label}</button>`).join('') +
      '</div>';
    const el = document.createElement('div');
    el.innerHTML = `
      <header class="header">
        <div class="container header-in">
          <a class="logo" href="index.html"><b>INAVTO</b><span>ASIA</span></a>
          <nav class="nav">${nav}</nav>
          <div class="header-cta">
            ${langHtml}
            <a class="header-phone" href="${C.phoneHref}">${C.phone}<small>ежедневно 9:00–21:00</small></a>
            <button class="btn btn-red btn-sm" data-quiz-open>Подобрать авто</button>
            <button class="burger" aria-label="Меню"><span></span><span></span><span></span></button>
          </div>
        </div>
      </header>
      <div class="mobile-menu">
        <a href="index.html">Главная</a>${nav}
        <a href="dostavka.html">Доставка и растаможка</a>
        <a href="vydannye-avto.html">Выданные авто</a>
        <a href="o-kompanii.html">О компании</a>
        <a href="${C.phoneHref}">${C.phone}</a>
        ${langHtml}
        <button class="btn btn-red btn-block" data-quiz-open>Подобрать авто</button>
      </div>`;
    document.body.prepend(el);

    /* Переключение языка */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (b && window.INAVTO_I18N) window.INAVTO_I18N.setLang(b.dataset.lang);
    });

    const burger = el.querySelector('.burger');
    const menu = el.querySelector('.mobile-menu');
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      menu.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.closest('[data-quiz-open]')) {
        burger.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- Layout: футер + плавающие кнопки ---------- */
  function renderFooter() {
    const el = document.createElement('div');
    el.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a class="logo" href="index.html"><b>INAVTO</b><span>ASIA</span></a>
              <p class="footer-about">Новые автомобили из Китая под заказ с доставкой «под ключ» и растаможкой в любой город России.</p>
            </div>
            <div>
              <h4>Каталог</h4>
              <a href="catalog.html">Авто из Китая</a>
              <a href="calculator.html">Калькулятор цены</a>
              <a href="index.html#popular">Популярные модели</a>
            </div>
            <div>
              <h4>Компания</h4>
              <a href="kak-my-rabotaem.html">Как мы работаем</a>
              <a href="vydannye-avto.html">Выданные авто</a>
              <a href="blog/index.html">Блог</a>
              <a href="garantii.html">Гарантии</a>
              <a href="dostavka.html">Доставка и растаможка</a>
              <a href="dlya-biznesa.html">Для бизнеса</a>
              <a href="o-kompanii.html">О компании</a>
              <a href="kontakty.html">Контакты</a>
            </div>
            <div>
              <h4>Связаться</h4>
              <a href="${C.phoneHref}">${C.phone}</a>
              <a href="${C.telegram}" target="_blank" rel="noopener">Telegram</a>
              <a href="${C.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
              <a href="mailto:${C.email}">${C.email}</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} INAVTO ASIA. Все цены на сайте ориентировочные и не являются публичной офертой.</span>
            <span><a href="privacy.html">Политика конфиденциальности</a></span>
          </div>
        </div>
      </footer>
      <div class="float-contact">
        <a class="float-tg" href="${C.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${ICONS.tg}</a>
        <a class="float-wa" href="${C.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONS.wa}</a>
      </div>
      <div class="cta-bar" role="navigation" aria-label="Быстрая связь">
        <a href="${C.phoneHref}" data-goal="phone_click">${ICONS.phone}<span>Звонок</span></a>
        <a href="${C.telegram}" target="_blank" rel="noopener" data-goal="tg_click">${ICONS.tg}<span>Telegram</span></a>
        <button class="cta-bar-main" data-quiz-open>Подбор авто</button>
      </div>`;
    document.body.append(el);

    /* Цели: клики по телефону/мессенджерам где угодно на странице */
    document.addEventListener('click', (e) => {
      const goalEl = e.target.closest('[data-goal]');
      if (goalEl) { A.goal(goalEl.dataset.goal); return; }
      const a = e.target.closest('a[href]');
      if (!a) return;
      if (a.href.startsWith('tel:')) A.goal('phone_click');
      else if (a.href.includes('t.me/')) A.goal('tg_click');
      else if (a.href.includes('wa.me/')) A.goal('wa_click');
    });
  }

  /* ---------- Визуал авто (SVG-силуэт на градиенте) ---------- */
  const CAR_SILHOUETTE = '<svg viewBox="0 0 520 190" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="262" cy="174" rx="216" ry="9" fill="rgba(0,0,0,0.35)"/>'
    + '<path d="M60 144c-18-2-26-12-24-26 2-10 9-17 22-21l20-6c22-30 50-47 92-53 60-8 128-6 172 4 32 8 56 24 74 43l36 8c24 5 36 14 38 26 2 14-6 23-24 25H60z" fill="url(#cbody)"/>'
    + '<path d="M162 50c44-8 112-8 154 0 20 4 36 14 47 27l-215 1c2-11 7-22 14-28z" fill="url(#cglass)"/>'
    + '<path d="M258 50v29" stroke="rgba(10,10,20,0.35)" stroke-width="4"/>'
    + '<path d="M96 116h332" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round"/>'
    + '<circle cx="138" cy="144" r="31" fill="#0b0b12"/><circle cx="138" cy="144" r="18" fill="#262635"/><circle cx="138" cy="144" r="17" stroke="#4a4a60" stroke-width="2"/><circle cx="138" cy="144" r="6" fill="#5c5c74"/>'
    + '<circle cx="396" cy="144" r="31" fill="#0b0b12"/><circle cx="396" cy="144" r="18" fill="#262635"/><circle cx="396" cy="144" r="17" stroke="#4a4a60" stroke-width="2"/><circle cx="396" cy="144" r="6" fill="#5c5c74"/>'
    + '<rect x="446" y="104" width="40" height="7" rx="3.5" fill="rgba(255,255,255,0.65)"/>'
    + '<rect x="38" y="104" width="24" height="7" rx="3.5" fill="rgba(255,80,100,0.75)"/>'
    + '<defs>'
    + '<linearGradient id="cbody" x1="0" y1="34" x2="0" y2="170"><stop stop-color="#5e6076"/><stop offset="0.55" stop-color="#333444"/><stop offset="1" stop-color="#20212c"/></linearGradient>'
    + '<linearGradient id="cglass" x1="0" y1="46" x2="0" y2="80"><stop stop-color="#b5c2d6" stop-opacity="0.95"/><stop offset="1" stop-color="#3c4658" stop-opacity="0.95"/></linearGradient>'
    + '</defs></svg>';

  A.carVisual = function (car, cls) {
    const flag = 'China';
    const photo = car.photos && car.photos[0];
    const media = photo
      ? `<img class="cv-photo" src="${photo}" alt="${car.name}" loading="lazy">`
      : CAR_SILHOUETTE;
    return `<div class="car-visual ${cls || ''}" style="background:linear-gradient(155deg, ${car.grad[0]}, ${car.grad[1]})">
      <span class="cv-brand">${car.brand}</span>
      <span class="cv-flag">${flag}</span>
      ${media}
    </div>`;
  };

  /* ---------- Галерея фото на странице модели ---------- */
  const CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  const CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  A.carGallery = function (car) {
    const photos = (car.photos && car.photos.length) ? car.photos : [];
    const grad = `linear-gradient(155deg, ${car.grad[0]}, ${car.grad[1]})`;
    const main = photos.length
      ? `<img class="cg-main-img" src="${photos[0]}" alt="${car.name}">`
      : CAR_SILHOUETTE;
    const multi = photos.length > 1;
    const nav = multi
      ? `<button class="cg-nav cg-prev" data-gallery-prev aria-label="Предыдущее фото">${CHEV_L}</button>
         <button class="cg-nav cg-next" data-gallery-next aria-label="Следующее фото">${CHEV_R}</button>
         <span class="cg-count"><b>1</b> / ${photos.length}</span>`
      : '';
    const thumbs = multi
      ? '<div class="cg-thumbs">' + photos.map((p, i) =>
          `<button class="cg-thumb${i === 0 ? ' active' : ''}" data-gallery-thumb="${i}" style="background-image:url('${p}')" aria-label="Фото ${i + 1}"></button>`).join('') + '</div>'
      : '';
    return `<div class="car-gallery" data-gallery>
      <div class="cg-main" style="background:${grad}"><span class="cg-brand">${car.brand}</span><span class="cg-flag">China</span>${main}${nav}</div>
      ${thumbs}
    </div>`;
  };
  function galleryGo(gal, idx) {
    const thumbs = gal.querySelectorAll('.cg-thumb');
    if (!thumbs.length) return;
    idx = (idx + thumbs.length) % thumbs.length;
    const url = thumbs[idx].style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    const img = gal.querySelector('.cg-main-img');
    if (img) img.src = url;
    thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
    const c = gal.querySelector('.cg-count b');
    if (c) c.textContent = idx + 1;
  }
  document.addEventListener('click', (e) => {
    const th = e.target.closest('[data-gallery-thumb]');
    if (th) { galleryGo(th.closest('[data-gallery]'), +th.dataset.galleryThumb); return; }
    const arrow = e.target.closest('[data-gallery-prev], [data-gallery-next]');
    if (arrow) {
      const gal = arrow.closest('[data-gallery]');
      const cur = [...gal.querySelectorAll('.cg-thumb')].findIndex((t) => t.classList.contains('active'));
      galleryGo(gal, cur + (arrow.hasAttribute('data-gallery-next') ? 1 : -1));
    }
  });

  A.carPills = function (car) {
    const used = car.cond === 'used';
    return `<div class="car-pills">
      <span>${car.body}</span><span>${car.fuel}</span><span>${car.year}</span>
      <span class="${used ? 'state-used' : 'state-new'}">${used ? 'С пробегом' : 'Новый'}</span>
    </div>`;
  };
  A.specGrid = function (specs) {
    return '<div class="spec-grid">' + specs.map(s =>
      `<div class="spec-item"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('') + '</div>';
  };

  /* ---------- Карточка авто ---------- */
  A.carUrl = (car) => (A.STATIC_SLUGS && A.STATIC_SLUGS.has(car.slug))
    ? 'cars/' + car.slug + '.html'
    : 'car.html?slug=' + car.slug;

  A.carCard = function (car) {
    const used = car.cond === 'used';
    const priceNote = used ? 'с пробегом, под ключ' : 'новый, под ключ';
    const fav = A.favs.has(car.slug);
    return `<article class="car-card reveal">
      <a href="${A.carUrl(car)}">${A.carVisual(car)}</a>
      <div class="car-card-body">
        <div class="car-card-head">
          <h3>${car.name}</h3>
          <button class="fav-btn${fav ? ' on' : ''}" data-fav="${car.slug}" aria-label="В избранное" title="В избранное">${ICONS.heart}</button>
        </div>
        <div class="car-sub">${car.body} · ${car.fuel}</div>
        <ul class="car-specs">
          <li><span>Мощность</span><b>${car.power}</b></li>
          ${used && car.mileage ? `<li><span>Пробег</span><b>${Number(car.mileage).toLocaleString('ru-RU')} км</b></li>` : `<li><span>Привод</span><b>${car.drive}</b></li>`}
          ${car.range !== '—' ? `<li><span>Запас хода</span><b>${car.range}</b></li>` : `<li><span>Год</span><b>${car.year}</b></li>`}
        </ul>
        <div class="car-price-row">
          <div class="car-price num">от ${car.price.toFixed(1).replace('.', ',')} млн ₽<small>${priceNote}</small></div>
        </div>
        <a class="btn btn-ghost btn-sm" href="${A.carUrl(car)}">Подробнее</a>
      </div>
    </article>`;
  };

  /* ---------- Квиз: две ветки — частник и бизнес ---------- */
  const QUIZ_BRANCHES = {
    start: [
      { key: 'segment', title: 'Для кого подбираем автомобиль?', options: ['Для себя / семьи', 'Для перепродажи / бизнеса'] },
    ],
    private: [
      { key: 'body', title: 'Какой тип кузова интересует?', options: ['Кроссовер / внедорожник', 'Седан', 'Другое / не важно'] },
      { key: 'fuel', title: 'Тип двигателя?', options: ['Бензин / дизель', 'Гибрид', 'Электро', 'Не определился(ась)'] },
      { key: 'budget', title: 'Бюджет «под ключ»?', options: ['До 2,5 млн ₽', '2,5–4 млн ₽', '4–6 млн ₽', 'Более 6 млн ₽'] },
    ],
    business: [
      { key: 'volume', title: 'Какой объём интересует?', options: ['1–2 авто', '3–10 авто в месяц', 'Более 10 в месяц'] },
      { key: 'budget', title: 'Закупочный бюджет на автомобиль?', options: ['До 2,5 млн ₽', '2,5–4 млн ₽', 'Более 4 млн ₽', 'Разные сегменты'] },
    ],
  };
  const quizSteps = (answers) => QUIZ_BRANCHES.start.concat(
    answers.segment === 'Для перепродажи / бизнеса' ? QUIZ_BRANCHES.business : QUIZ_BRANCHES.private
  );
  const DRAFT_KEY = 'inavto_quiz_draft';
  const loadDraft = () => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch (e) { return null; }
  };
  const saveDraft = (state) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ }
  };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* — */ } };

  function renderQuizModal() {
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.id = 'quiz-modal';
    el.innerHTML = `<div class="modal">
      <button class="modal-close" aria-label="Закрыть">✕</button>
      <div id="quiz-body"></div>
    </div>`;
    document.body.append(el);

    const state = { step: 0, answers: {} };
    const body = el.querySelector('#quiz-body');

    function draw() {
      const steps = quizSteps(state.answers);
      const total = steps.length + 1;
      saveDraft(state);
      if (state.step < steps.length) {
        const s = steps[state.step];
        const pct = (state.step / total) * 100;
        body.innerHTML = `
          <div class="muted" style="font-size:13px;font-weight:700">Шаг ${state.step + 1} из ${total}</div>
          <div class="quiz-progress"><i style="width:${pct}%"></i></div>
          <h3 class="h3" style="margin-bottom:18px">${s.title}</h3>
          <div class="quiz-options">
            ${s.options.map(o => `<button class="quiz-option${state.answers[s.key] === o ? ' selected' : ''}" data-val="${o}">${o}</button>`).join('')}
          </div>
          <div class="quiz-nav">
            ${state.step > 0 ? '<button class="btn btn-ghost btn-sm" data-back>Назад</button>' : ''}
          </div>`;
        body.querySelectorAll('.quiz-option').forEach(b => b.addEventListener('click', () => {
          if (s.key === 'segment' && state.answers.segment !== b.dataset.val) state.answers = {};
          state.answers[s.key] = b.dataset.val;
          state.step++;
          A.goal('quiz_step_' + state.step);
          draw();
        }));
        const back = body.querySelector('[data-back]');
        if (back) back.addEventListener('click', () => { state.step--; draw(); });
      } else {
        const isBiz = state.answers.segment === 'Для перепродажи / бизнеса';
        const pct = (steps.length / total) * 100;
        body.innerHTML = `
          <div class="muted" style="font-size:13px;font-weight:700">Последний шаг</div>
          <div class="quiz-progress"><i style="width:${pct}%"></i></div>
          <h3 class="h3" style="margin-bottom:8px">${isBiz ? 'Куда отправить условия для бизнеса?' : 'Куда отправить подборку?'}</h3>
          <p class="muted" style="font-size:14px;margin-bottom:18px">${isBiz
            ? 'Пришлём комиссию, условия по партиям и расчёт на интересующие модели — в течение рабочего дня.'
            : 'Менеджер подберёт 3–5 вариантов под ваш запрос и пришлёт расчёт «под ключ».'}</p>
          <form class="form-grid" id="quiz-form">
            <div class="form-field"><label>Ваше имя</label><input name="name" placeholder="Имя" required></div>
            <div class="form-field"><label>Телефон</label><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required></div>
            <div class="form-field"><label>${isBiz ? 'Регион работы' : 'Город доставки'}</label><input name="city" placeholder="${isBiz ? 'Например, Сибирь' : 'Например, Москва'}"></div>
            <div class="form-field"><label>Как с вами связаться?</label><select name="messenger">
              <option>Telegram</option><option>WhatsApp</option><option>Звонок по телефону</option>
            </select></div>
            <button class="btn btn-red btn-block" type="submit">${isBiz ? 'Получить условия' : 'Получить подборку'}</button>
            <div class="form-note">Нажимая кнопку, вы соглашаетесь с <a href="privacy.html">политикой конфиденциальности</a>.</div>
          </form>
          <div class="quiz-nav"><button class="btn btn-ghost btn-sm" data-back>Назад</button></div>`;
        body.querySelector('[data-back]').addEventListener('click', () => { state.step--; draw(); });
        attachPhoneMask(body.querySelector('input[name=phone]'));
        ensureConsent(body.querySelector('#quiz-form'));
        body.querySelector('#quiz-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target;
          const city = f.city.value.trim();
          const messenger = f.messenger ? f.messenger.value : '';
          const payload = {
            name: f.name.value.trim(),
            phone: f.phone.value.trim(),
            city: city + (messenger ? (city ? ' · ' : '') + 'связь: ' + messenger : ''),
            budget: state.answers.budget || '',
            brand: isBiz ? '#бизнес ' + (state.answers.volume || '') : '#длясебя',
            body: state.answers.body || '',
            fuel: state.answers.fuel || '',
          };
          if (!validPhone(payload.phone)) { f.phone.classList.add('error'); return; }
          if (!consentOK(f)) return;
          await submitLead(payload, f);
          clearDraft();
          body.innerHTML = successHTML('Заявка отправлена!', isBiz
            ? 'Менеджер по работе с бизнесом свяжется с вами в течение рабочего дня с условиями и расчётом.'
            : 'Менеджер свяжется с вами в ближайшее время и пришлёт персональную подборку с расчётом «под ключ».');
          state.step = 0; state.answers = {};
        });
      }
    }

    function open() {
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      const draft = loadDraft();
      if (draft && draft.step > 0 && draft.answers) {
        state.step = Math.min(draft.step, quizSteps(draft.answers).length);
        state.answers = draft.answers;
      } else {
        state.step = 0; state.answers = {};
      }
      draw();
      A.goal('quiz_open');
    }
    function close() { el.classList.remove('open'); document.body.style.overflow = ''; }
    el.querySelector('.modal-close').addEventListener('click', close);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-quiz-open]');
      if (t) { e.preventDefault(); open(); }
    });
  }

  function successHTML(title, text) {
    return `<div class="quiz-success">
      <div class="icon-ok">${ICONS.check.replace('<svg', '<svg width="28" height="28"')}</div>
      <h3 class="h3" style="margin-bottom:10px">${title}</h3>
      <p class="muted" style="font-size:14.5px">${text}</p>
      <a class="btn btn-ghost btn-sm" style="margin-top:20px" href="${C.telegram}" target="_blank" rel="noopener">Написать в Telegram</a>
    </div>`;
  }

  /* ---------- Отправка заявок ---------- */
  function validPhone(v) { return v.replace(/\D/g, '').length >= 10; }

  let leadSubmitted = false;
  async function submitLead(payload, form) {
    if (form) form.querySelector('button[type=submit]').disabled = true;
    leadSubmitted = true;
    A.goal('lead_submit');
    try {
      await fetch(API_BASE + '/api/selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // API недоступен (статический хостинг) — заявка не потеряется: покажем контакты
      console.warn('Lead API unavailable', err);
    }
  }
  A.submitLead = submitLead;
  A.validPhone = validPhone;
  A.successHTML = successHTML;

  /* ---------- Маска телефона ---------- */
  function attachPhoneMask(input) {
    if (!input) return;
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      let out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += '-' + d.slice(7, 9);
      if (d.length >= 9) out += '-' + d.slice(9, 11);
      input.value = out;
      input.classList.remove('error');
    });
  }
  A.attachPhoneMask = attachPhoneMask;

  /* ---------- Согласие на обработку персональных данных (152-ФЗ) ---------- */
  function ensureConsent(form) {
    if (!form || form.querySelector('input[name=consent]')) return;
    const l = document.createElement('label');
    l.className = 'consent';
    l.innerHTML = '<input type="checkbox" name="consent" required>' +
      '<span>Я согласен на обработку <a href="privacy.html" target="_blank" rel="noopener">персональных данных</a></span>';
    l.querySelector('input').addEventListener('change', () => l.classList.remove('error'));
    const btn = form.querySelector('button[type=submit]');
    if (btn) form.insertBefore(l, btn); else form.appendChild(l);
  }
  function consentOK(form) {
    const c = form.querySelector('input[name=consent]');
    if (c && !c.checked) { c.closest('.consent').classList.add('error'); c.focus(); return false; }
    return true;
  }
  A.ensureConsent = ensureConsent;
  A.consentOK = consentOK;

  /* ---------- Обычные формы (обратный звонок и т.п.) ---------- */
  function bindLeadForms() {
    document.querySelectorAll('form[data-lead-form]').forEach((f) => {
      attachPhoneMask(f.querySelector('input[name=phone]'));
      ensureConsent(f);
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messenger = f.messenger ? f.messenger.value : '';
        const comment = (f.querySelector('[name=comment]') && f.querySelector('[name=comment]').value || '').trim();
        const payload = {
          name: (f.name && f.name.value || '').trim() || '—',
          phone: (f.phone && f.phone.value || '').trim(),
          city: (f.city && f.city.value || '').trim(),
          budget: f.dataset.leadForm || 'заявка с сайта',
          brand: (f.dataset.brand || ''),
          body: comment + (messenger ? (comment ? ' · ' : '') + 'связь: ' + messenger : ''),
          fuel: '',
        };
        if (!validPhone(payload.phone)) { f.phone.classList.add('error'); return; }
        if (!consentOK(f)) return;
        await submitLead(payload, f);
        f.innerHTML = successHTML('Спасибо, заявка принята!', 'Мы перезвоним в ближайшее рабочее время (ежедневно 9:00–21:00 мск).');
      });
    });
  }

  /* ---------- Брошенная форма: телефон введён, но не отправлен ---------- */
  let abandonFired = false;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden' || leadSubmitted || abandonFired) return;
    const dirty = Array.from(document.querySelectorAll('input[name=phone]'))
      .some((i) => i.value.replace(/\D/g, '').length >= 10);
    if (dirty) { abandonFired = true; A.goal('form_abandon'); }
  });

  /* ---------- Reveal при скролле ---------- */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }
  A.initReveal = initReveal;

  /* ---------- Выданные авто ---------- */
  A.deliveredCard = function (d, demo) {
    const car = A.CARS.find(c => c.name === d.model);
    const photo = d.photo
      ? `<img src="${d.photo}" alt="Вручение ${d.model} — ${d.city}" loading="lazy">`
      : (car ? A.carVisual(car) : '');
    return `<article class="delivered-card reveal">
      <div class="dc-photo">
        <span class="dc-badge">${demo ? 'макет' : 'выдано'}</span>
        ${photo}
        ${demo ? '<span class="demo-ribbon">Здесь будет фото вручения</span>' : ''}
      </div>
      <div class="dc-body">
        <h3>${d.model}</h3>
        <div class="dc-meta"><span>${d.city} · ${d.date}</span><b>${d.days} дн. до выдачи</b></div>
      </div>
    </article>`;
  };

  /* ---------- Трекер ---------- */
  A.trackerHTML = function (doneCount) {
    return `<div class="tracker-line">${A.STAGES.map((s, i) => {
      const cls = i < doneCount ? 'done' : (i === doneCount ? 'current' : '');
      return `<div class="tracker-node ${cls}">
        <div class="tracker-dot">${i < doneCount ? ICONS.check : ''}</div>
        <b>${s.t}</b><span>${s.s}</span>
      </div>`;
    }).join('')}</div>`;
  };

  /* ---------- FAQ ---------- */
  function initFaq() {
    document.querySelectorAll('.faq-q').forEach((q) => {
      q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
    });
  }
  A.initFaq = initFaq;

  /* ---------- Параллакс силуэтов авто ---------- */
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const vh = window.innerHeight;
      document.querySelectorAll('.car-visual svg, .hero-photo img').forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -0.05;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  A.initParallax = initParallax;

  /* ---------- Count Up: числа набегают при появлении ---------- */
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  function animateText(el, dur) {
    // находит числа в тексте элемента и анимирует каждое от 0 до цели, сохраняя формат
    const original = el.textContent;
    const re = /(\d[\d\s ]*(?:[.,]\d+)?)/g;
    const parts = [];
    let last = 0, m;
    while ((m = re.exec(original)) !== null) {
      parts.push({ text: original.slice(last, m.index) });
      const tok = m[1];
      const dec = (tok.match(/[.,](\d+)$/) || [, ''])[1].length;
      parts.push({
        target: parseFloat(tok.replace(/[\s ]/g, '').replace(',', '.')),
        dec,
        grouped: /[\s ]/.test(tok.replace(/[.,]\d+$/, '')),
        sep: tok.includes(',') ? ',' : '.',
      });
      last = m.index + tok.length;
    }
    parts.push({ text: original.slice(last) });
    if (!parts.some((p) => p.target !== undefined)) return;

    const fmt = (p, v) => {
      let str = v.toFixed(p.dec);
      let [int, frac] = str.split('.');
      if (p.grouped) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return frac ? int + p.sep + frac : int;
    };
    const start = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const k = easeOut(t);
      el.textContent = parts.map((p) =>
        p.target === undefined ? p.text : fmt(p, p.target * k)).join('');
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = original;
    })(start);
  }

  function initCountUp() {
    if (reducedMotion()) return;
    const els = document.querySelectorAll('.hero-stats b');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        animateText(en.target, 1200);
      });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* Плавное перетекание числа (итог калькулятора) */
  A.tweenNumber = function (el, from, to, fmtFn) {
    if (reducedMotion() || !isFinite(from) || from === to) { el.textContent = fmtFn(to); return; }
    const start = performance.now(), dur = 350;
    (function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = fmtFn(from + (to - from) * easeOut(t));
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  };

  /* ---------- Магнитные CTA-кнопки ---------- */
  function initMagnetic() {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return;
    let active = null;
    document.addEventListener('mousemove', (e) => {
      const b = e.target.closest ? e.target.closest('.btn-red') : null;
      if (active && active !== b) { active.style.transform = ''; active = null; }
      if (!b) return;
      const r = b.getBoundingClientRect();
      const clamp = (v) => Math.max(-8, Math.min(8, v));
      const dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.16);
      const dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.28);
      b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      active = b;
    }, { passive: true });
    document.addEventListener('mouseout', (e) => {
      const b = e.target.closest ? e.target.closest('.btn-red') : null;
      if (b && !(e.relatedTarget && b.contains(e.relatedTarget))) {
        b.style.transform = '';
        if (active === b) active = null;
      }
    }, { passive: true });
  }

  /* ---------- Пословное раскрытие заголовка ---------- */
  function initHeroReveal() {
    if (reducedMotion()) return;
    const h = document.querySelector('.hero .h1, .page-hero .h1');
    if (!h) return;
    let idx = 0;
    const splitNode = (node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach((piece) => {
          if (!piece) return;
          if (/^\s+$/.test(piece)) { frag.appendChild(document.createTextNode(piece)); return; }
          const w = document.createElement('span');
          w.className = 'wrd';
          const i = document.createElement('i');
          i.style.transitionDelay = (idx++ * 60) + 'ms';
          i.textContent = piece;
          w.appendChild(i);
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.from(node.childNodes).forEach(splitNode);
      }
    };
    Array.from(h.childNodes).forEach(splitNode);
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('h1-revealed')));
  }

  /* ---------- Каталог с сервера (админка) с фолбэком на data.js ---------- */
  async function loadRemoteCatalog() {
    // Адрес API задаёт window.INAVTO_API; если он не задан, но сайт открыт
    // по http(s) — пробуем тот же домен (на VPS nginx проксирует /api на бэкенд).
    // Открыт как файл (file://) — работаем только от встроенного data.js.
    if (!window.INAVTO_API && !/^https?:$/.test(location.protocol)) return;
    A.STATIC_SLUGS = new Set(A.CARS.map((c) => c.slug));
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch(API_BASE + '/api/site-cars', { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return;
      const list = await r.json();
      if (Array.isArray(list) && list.length) {
        // фото приходят путями вида /uploads/…: если API на другом домене — делаем абсолютными
        if (API_BASE) list.forEach((c) => {
          if (Array.isArray(c.photos)) c.photos = c.photos.map((p) =>
            (typeof p === 'string' && p.startsWith('/')) ? API_BASE + p : p);
        });
        A.CARS = list;
      }
    } catch (e) { /* сервер молчит — показываем встроенный каталог */ }
  }

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    await loadRemoteCatalog();
    renderHeader();
    renderFooter();
    renderQuizModal();
    if (typeof window.INAVTO_PAGE_INIT === 'function') window.INAVTO_PAGE_INIT();
    bindLeadForms();
    initReveal();
    initFaq();
    initParallax();
    initCountUp();
    initMagnetic();
    initHeroReveal();
    initCookie();
  });

  /* ---------- Cookie-уведомление ---------- */
  function initCookie() {
    if (localStorage.getItem('inavto_cookie_ok')) return;
    const bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.innerHTML =
      '<p>Мы используем cookie и сервисы аналитики, чтобы сайт работал и становился удобнее. ' +
      'Оставаясь на сайте, вы соглашаетесь с <a href="privacy.html">политикой конфиденциальности</a>.</p>' +
      '<button class="btn btn-red btn-sm" type="button">Хорошо</button>';
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add('show'));
    bar.querySelector('button').addEventListener('click', () => {
      try { localStorage.setItem('inavto_cookie_ok', '1'); } catch (e) { /* приватный режим */ }
      bar.classList.remove('show');
      setTimeout(() => bar.remove(), 350);
    });
  }
})();
