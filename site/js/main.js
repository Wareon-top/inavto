/* INAVTO ASIA — общий скрипт: layout, квиз, каталог, формы */
(function () {
  const A = window.INAVTO;
  const C = A.CONTACTS;
  // Backend Express (тот же, что у Telegram Mini App). Пусто = same-origin /api.
  const API_BASE = window.INAVTO_API || '';
  A.CATALOG_FROM_API = false;

  /* Цели Яндекс.Метрики: задать window.INAVTO_YM_ID = <номер счётчика> */
  const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const ATTR_KEY = 'inavto_attribution';
  function attribution() {
    const params = new URLSearchParams(window.location.search);
    const current = Object.fromEntries(ATTR_KEYS.map((key) => [key, (params.get(key) || '').slice(0, 160)]));
    const hasUtm = ATTR_KEYS.some((key) => current[key]);
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(ATTR_KEY)) || {}; } catch (_e) { /* — */ }
    if (hasUtm) {
      saved = current;
      try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(saved)); } catch (_e) { /* — */ }
    }
    let referrerSource = '';
    try { referrerSource = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_e) { /* — */ }
    const values = { ...current, ...saved };
    return {
      ...values,
      source: values.utm_source || referrerSource || 'direct',
    };
  }
  A.analyticsContext = function (carName) {
    return { page_url: window.location.href, car_name: String(carName || '').trim(), ...attribution() };
  };
  A.goal = function (name, params) {
    try {
      if (typeof window.ym === 'function' && window.INAVTO_YM_ID) {
        window.ym(window.INAVTO_YM_ID, 'reachGoal', name, params || {});
      }
    } catch (e) { /* аналитика не должна ломать сайт */ }
  };

  /* ---------- Блог: карточки берут единственную обложку из админки ---------- */
  const escBlog = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  A.blogCard = function (post) {
    const locale = window.INAVTO_I18N && window.INAVTO_I18N.lang;
    const translated = window.INAVTO_BLOG_TRANSLATIONS && window.INAVTO_BLOG_TRANSLATIONS[locale] &&
      window.INAVTO_BLOG_TRANSLATIONS[locale][post.slug];
    const view = translated ? { ...post, title: translated.title, excerpt: translated.excerpt,
      category: translated.category, readTime: translated.readTime } : post;
    const cover = typeof view.cover === 'string' && /^\/uploads\/[A-Za-z0-9._-]+$/.test(view.cover)
      ? `<img src="${escBlog(view.cover)}" alt="" loading="lazy">` : '';
    return `<a class="blog-card reveal" href="blog/${encodeURIComponent(view.slug)}.html" data-goal="blog_related_click">
      <span class="blog-card-cover">${cover}</span>
      <div class="blog-card-copy">
        <span class="bc-meta">${escBlog(view.category)} · ${escBlog(view.readTime)}</span>
        <h3>${escBlog(view.title)}</h3>
        <span class="blog-card-text">${escBlog(view.excerpt)}</span>
        <span class="bc-more">Читать →</span>
      </div>
    </a>`;
  };
  A.loadBlog = async function () {
    try {
      const response = await fetch(API_BASE + '/api/blog');
      if (!response.ok) return [];
      const posts = await response.json();
      return Array.isArray(posts) ? posts : [];
    } catch (_e) { return []; }
  };

  /* ---------- Автомобили в пути: реальные обновления из админки ---------- */
  const STORY_STAGES = {
    shipping: 'Отправка из Китая', border: 'Граница', transit: 'В пути по России',
    customs: 'Таможня', delivery: 'Доставка клиенту', done: 'Автомобиль выдан',
  };
  const storyMedia = (value) => typeof value === 'string' && /^(?:\/uploads\/[A-Za-z0-9._/-]+|https:\/\/[^\s]+)$/i.test(value) ? value : '';
  const storyIsVideo = (url) => /\.(?:mp4|webm|mov)(?:[?#].*)?$/i.test(url || '');
  const storyDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '';
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
  };
  A.loadDeliveryStories = async function () {
    try {
      const response = await fetch(API_BASE + '/api/delivery-stories');
      if (!response.ok) return [];
      const stories = await response.json();
      return Array.isArray(stories) ? stories : [];
    } catch (_e) { return []; }
  };
  A.deliveryStoryCard = function (story) {
    const cover = storyMedia(story.coverUrl);
    const stage = STORY_STAGES[story.stage] || 'Обновление доставки';
    const route = [story.fromCity, story.toCity].filter(Boolean).join(' → ');
    const media = cover ? `<img src="${escBlog(cover)}" alt="" loading="lazy">` : '<span class="delivery-story-placeholder">INAVTO<br>ASIA</span>';
    return `<a class="delivery-story-card reveal" href="delivery-story.html?slug=${encodeURIComponent(story.slug)}" data-goal="delivery_story_open">
      <span class="delivery-story-media">${media}<span class="delivery-story-play" aria-hidden="true">▶</span><span class="delivery-story-stage">${escBlog(stage)}</span></span>
      <span class="delivery-story-copy"><span class="delivery-story-date">${escBlog(storyDate(story.storyDate))}</span><strong>${escBlog(story.title)}</strong><span class="delivery-story-route">${escBlog(route || story.vehicles || 'Маршрут уточняется')}</span><span class="delivery-story-more">Смотреть обновление <b>→</b></span></span>
    </a>`;
  };
  function renderDeliveryStoryPage() {
    const root = document.querySelector('[data-delivery-story]');
    if (!root) return;
    const slug = new URLSearchParams(location.search).get('slug') || '';
    A.loadDeliveryStories().then((stories) => {
      const story = stories.find((item) => item.slug === slug);
      if (!story) { root.innerHTML = '<div class="empty-state"><h2 class="h2">Обновление не найдено</h2><p class="lead">Посмотрите все реальные этапы доставки автомобилей.</p><a class="btn btn-red" href="delivery-stories.html">Все автомобили в пути</a></div>'; return; }
      const stage = STORY_STAGES[story.stage] || 'Обновление доставки';
      const route = [story.fromCity, story.toCity].filter(Boolean).join(' → ');
      const video = storyMedia(story.videoUrl);
      const cover = storyMedia(story.coverUrl);
      const videoHtml = storyIsVideo(video) ? `<video class="delivery-story-video" controls playsinline preload="metadata"${cover ? ` poster="${escBlog(cover)}"` : ''}><source src="${escBlog(video)}">Ваш браузер не поддерживает видео.</video>` : (cover ? `<img class="delivery-story-cover" src="${escBlog(cover)}" alt="${escBlog(story.title)}">` : '');
      root.innerHTML = `<div class="breadcrumbs"><a href="index.html">Главная</a> / <a href="delivery-stories.html">Автомобили в пути</a> / ${escBlog(story.vehicles || 'Обновление')}</div>
        <div class="delivery-story-layout"><div><div class="divider-label">${escBlog(stage)}</div><h1 class="h1">${escBlog(story.title)}</h1><p class="lead">${escBlog(story.excerpt || 'Показываем реальный этап маршрута автомобиля к заказчику.')}</p><dl class="delivery-story-facts"><div><dt>Автомобили</dt><dd>${escBlog(story.vehicles || '—')}</dd></div><div><dt>Маршрут</dt><dd>${escBlog(route || '—')}</dd></div><div><dt>Обновлено</dt><dd>${escBlog(storyDate(story.storyDate) || '—')}</dd></div></dl></div><div class="delivery-story-player">${videoHtml || '<div class="delivery-story-placeholder">Видео будет добавлено</div>'}</div></div>
        ${story.body ? `<div class="delivery-story-text"><p>${escBlog(story.body)}</p></div>` : ''}
        <div class="cta-banner delivery-story-cta"><div><h2 class="h2">Хотите такое же сопровождение?</h2><p class="lead">Подберём автомобиль, рассчитаем стоимость и будем держать вас в курсе на каждом этапе доставки.</p></div><div class="cta-banner-actions"><button class="btn btn-red" data-quiz-open>Подобрать автомобиль</button><a class="btn btn-ghost" href="calculator.html">Рассчитать стоимость</a></div></div>`;
      document.title = `${story.title} — INAVTO ASIA`;
      A.initReveal();
    });
  }

  /* Конверсионное продолжение статьи: внутренние страницы + другие материалы.
     Атрибут data-blog-article ставится только на полноценных статьях, поэтому
     блок не появляется на странице списка блога. */
  function renderBlogArticleEnd() {
    const currentSlug = document.body.dataset.blogArticle;
    if (!currentSlug) return;
    const heroContainer = document.querySelector('.page-hero .container');
    const coverFigure = document.createElement('figure');
    coverFigure.className = 'article-hero-cover';
    coverFigure.hidden = true;
    coverFigure.setAttribute('data-article-cover', '');
    if (heroContainer) heroContainer.appendChild(coverFigure);
    const section = document.createElement('section');
    section.className = 'section article-next-section';
    section.setAttribute('aria-labelledby', 'article-next-title');
    section.innerHTML = `<div class="container">
      <div class="article-next-panel reveal">
        <a class="article-next-banner" href="catalog.html" data-goal="article_banner_catalog">
          <img src="img/article-next-banner.webp" alt="INAVTO ASIA — привезём автомобиль из Китая" loading="lazy">
          <span>Перейти к автомобилям и ценам <b>→</b></span>
        </a>
        <div class="article-next-copy">
          <div>
            <div class="divider-label">Продолжить знакомство с INAVTO ASIA</div>
            <h2 class="h2" id="article-next-title">Проверьте условия перед выбором автомобиля</h2>
            <p class="lead">Сравните модели и цены, изучите договорные гарантии и посмотрите каждый этап доставки до вашего города.</p>
          </div>
          <div class="article-next-actions">
            <a class="btn btn-red" href="catalog.html" data-goal="article_primary_catalog">Смотреть автомобили</a>
            <a class="btn btn-white" href="calculator.html" data-goal="article_primary_calc">Рассчитать стоимость</a>
          </div>
        </div>
        <nav class="article-path-grid" aria-label="Полезные разделы сайта">
          <a class="article-path-card" href="catalog.html" data-goal="article_to_catalog"><i>01</i><small>Модели и цены</small><strong>Каталог автомобилей</strong><span>Смотреть каталог →</span></a>
          <a class="article-path-card" href="garantii.html" data-goal="article_to_warranty"><i>02</i><small>Защита покупателя</small><strong>Гарантии компании</strong><span>Изучить гарантии →</span></a>
          <a class="article-path-card" href="dostavka.html" data-goal="article_to_delivery"><i>03</i><small>Сроки и документы</small><strong>Доставка из Китая</strong><span>Как проходит доставка →</span></a>
          <a class="article-path-card" href="kak-my-rabotaem.html" data-goal="article_to_process"><i>04</i><small>От заявки до выдачи</small><strong>Как мы работаем</strong><span>Посмотреть этапы →</span></a>
        </nav>
      </div>
      <div class="article-related reveal" aria-labelledby="article-related-title">
        <div class="section-head">
          <div><div class="divider-label">Читайте также</div><h2 class="h2" id="article-related-title">Вам может быть полезно</h2></div>
          <a class="text-link" href="blog/index.html" data-goal="article_to_blog">Все статьи →</a>
        </div>
        <div class="blog-grid" data-related-blog></div>
      </div>
    </div>`;
    const firstScript = document.querySelector('script[src="js/data.js"]');
    document.body.insertBefore(section, firstScript || null);
    A.loadBlog().then((posts) => {
      const grid = section.querySelector('[data-related-blog]');
      const current = posts.find((post) => post.slug === currentSlug);
      if (current && typeof current.cover === 'string' && /^\/uploads\/[A-Za-z0-9._-]+$/.test(current.cover)) {
        const articleTitle = document.querySelector('.page-hero h1')?.textContent || current.title;
        coverFigure.innerHTML = `<img src="${escBlog(current.cover)}" alt="Обложка статьи: ${escBlog(articleTitle)}" loading="eager" decoding="async">`;
        coverFigure.hidden = false;
      }
      const related = posts.filter((post) => post.slug !== currentSlug).slice(0, 3);
      if (!related.length) {
        section.querySelector('.article-related').remove();
        return;
      }
      grid.innerHTML = related.map(A.blogCard).join('');
      A.initReveal();
    });
  }

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
    max: '<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.4a9.6 9.6 0 1 1-6.9 16.3c-.9 1.1-2.2 1.8-3.9 2-.4.1-.6-.4-.3-.7.9-1 1.4-2.1 1.5-3.3A9.6 9.6 0 0 1 12 2.4Zm0 4.8a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z"/></svg>',
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

  const hotInfo = (car) => {
    if (!car || !car.hot || !(Number(car.hot.oldPrice) > Number(car.price))) return null;
    const deadline = new Date(car.hot.deadline);
    if (!Number.isFinite(deadline.getTime()) || deadline.getTime() <= Date.now()) return null;
    return { oldPrice: Number(car.hot.oldPrice), deadline };
  };
  A.hotInfo = hotInfo;

  /* ---------- Layout: шапка ---------- */
  const page = document.body.dataset.page || '';
  const navLinks = [
    ['catalog.html', 'Каталог', 'catalog'],
    ['calculator.html', 'Калькулятор', 'calculator'],
    ['kak-my-rabotaem.html', 'Как мы работаем', 'process'],
    ['delivery-stories.html', 'Авто в пути', 'stories'],
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
    const C0 = A.COMPANY || {};
    const el = document.createElement('div');
    el.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a class="logo" href="index.html"><b>INAVTO</b><span>ASIA</span></a>
              <p class="footer-about">INAVTO ASIA («Инавто Азия») — новые автомобили из Китая под заказ с доставкой «под ключ» и растаможкой в любой город России.</p>
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
              <a href="delivery-stories.html">Авто в пути</a>
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
              <a href="https://dzen.ru/id/6a885c029f2d295ebd3d35fe?share_to=link" target="_blank" rel="noopener noreferrer" data-goal="social_dzen_click">Дзен</a>
              <a href="${C.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
              ${C.max ? `<a href="${C.max}" target="_blank" rel="noopener">MAX</a>` : ''}
              <a href="mailto:${C.email}">${C.email}</a>
            </div>
          </div>
          <div class="footer-legal">
            <b>${C0.short}</b>
            <span>ИНН ${C0.inn}</span>
            <span>КПП ${C0.kpp}</span>
            <span>ОГРН ${C0.ogrn}</span>
            ${C0.address ? `<span>${C0.address}</span>` : ''}
            <a href="rekvizity.html">Все реквизиты</a>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} INAVTO ASIA. Все цены на сайте ориентировочные и не являются публичной офертой.</span>
            <span class="footer-docs">
              <a href="privacy.html">Политика конфиденциальности</a>
              <a href="soglasie.html">Согласие на обработку данных</a>
              <a href="usloviya.html">Пользовательское соглашение</a>
            </span>
          </div>
        </div>
      </footer>
      <div class="float-contact">
        <a class="float-tg" href="${C.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${ICONS.tg}</a>
        <a class="float-wa" href="${C.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONS.wa}</a>
        ${C.max ? `<a class="float-max" href="${C.max}" target="_blank" rel="noopener" aria-label="MAX">${ICONS.max}</a>` : ''}
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
      else if (a.href.includes('max.ru/')) A.goal('max_click');
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
      return;
    }
    const mainImage = e.target.closest('.cg-main-img');
    if (mainImage) {
      openGalleryLightbox(mainImage.closest('[data-gallery]'));
    }
  });

  let lightboxState = null;
  function galleryUrls(gal) {
    const thumbs = [...gal.querySelectorAll('.cg-thumb')].map((thumb) =>
      thumb.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''));
    if (thumbs.length) return thumbs;
    const image = gal.querySelector('.cg-main-img');
    return image && image.src ? [image.src] : [];
  }
  function paintLightbox() {
    if (!lightboxState) return;
    const box = document.getElementById('gallery-lightbox');
    const total = lightboxState.urls.length;
    lightboxState.index = (lightboxState.index + total) % total;
    box.querySelector('img').src = lightboxState.urls[lightboxState.index];
    box.querySelector('[data-lightbox-count]').textContent = `${lightboxState.index + 1} / ${total}`;
    box.querySelectorAll('[data-lightbox-prev], [data-lightbox-next]').forEach((b) => { b.hidden = total < 2; });
  }
  function closeGalleryLightbox() {
    const box = document.getElementById('gallery-lightbox');
    if (box) box.classList.remove('open');
    lightboxState = null;
    document.body.style.overflow = '';
  }
  function openGalleryLightbox(gal) {
    const urls = galleryUrls(gal);
    if (!urls.length) return;
    let box = document.getElementById('gallery-lightbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'gallery-lightbox';
      box.className = 'gallery-lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Просмотр фотографий автомобиля');
      box.innerHTML = `<button class="gl-close" type="button" data-lightbox-close aria-label="Закрыть">✕</button><button class="gl-nav gl-prev" type="button" data-lightbox-prev aria-label="Предыдущее фото">${CHEV_L}</button><img alt="Фото автомобиля"><button class="gl-nav gl-next" type="button" data-lightbox-next aria-label="Следующее фото">${CHEV_R}</button><span class="gl-count" data-lightbox-count></span>`;
      document.body.appendChild(box);
    }
    const current = gal.querySelector('.cg-thumb.active');
    lightboxState = { urls, index: current ? +current.dataset.galleryThumb : 0 };
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
    paintLightbox();
    box.querySelector('[data-lightbox-close]').focus();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-lightbox-close]') || e.target.id === 'gallery-lightbox') closeGalleryLightbox();
    if (e.target.closest('[data-lightbox-prev]') && lightboxState) { lightboxState.index--; paintLightbox(); }
    if (e.target.closest('[data-lightbox-next]') && lightboxState) { lightboxState.index++; paintLightbox(); }
  });
  document.addEventListener('keydown', (e) => {
    if (lightboxState) {
      if (e.key === 'Escape') closeGalleryLightbox();
      if (e.key === 'ArrowLeft') { lightboxState.index--; paintLightbox(); }
      if (e.key === 'ArrowRight') { lightboxState.index++; paintLightbox(); }
      return;
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
  /* Своя страница есть у встроенных моделей и у машин каталога, для которых
     её сгенерировал бэкенд (car.page). Остальные открываем через car.html. */
  A.carUrl = (car) => (car.page || (A.STATIC_SLUGS && A.STATIC_SLUGS.has(car.slug)))
    ? 'cars/' + car.slug + '.html'
    : 'car.html?slug=' + car.slug;

  /* Описание машины на языке посетителя.
     Приоритет: ручной перевод из админки → словарный перевод (встроенные модели) →
     автоописание из характеристик. Русская версия всегда показывает исходный текст. */
  A.localDesc = function (car) {
    const I = window.INAVTO_I18N || {};
    const lang = I.lang || 'ru';
    if (lang === 'ru') return car.desc || '';
    if (lang === 'zh' && car.descZh) return car.descZh;
    if (lang === 'en' && car.descEn) return car.descEn;
    if (car.desc && I.tr && I.tr(car.desc) !== null) return car.desc; // переведёт словарь
    const tv = (s) => (s && I.tr && I.tr(s)) || s || '';
    const used = car.cond === 'used';
    const parts = [];
    if (car.body) parts.push(tv(car.body));
    if (car.fuel) parts.push(tv(car.fuel));
    if (car.power && car.power !== '—') parts.push(lang === 'zh' ? '功率 ' + tv(car.power) : tv(car.power));
    if (car.drive && car.drive !== '—') parts.push(tv(car.drive));
    if (car.range && car.range !== '—') parts.push((lang === 'zh' ? '续航 ' : 'range ') + tv(car.range));
    if (used && car.mileage) {
      const km = Number(car.mileage).toLocaleString('en-US');
      parts.push(lang === 'zh' ? '里程 ' + km + ' 公里' : 'mileage ' + km + ' km');
    }
    if (lang === 'zh') {
      return car.name + (car.year ? '（' + car.year + ' 年款）' : '') + ' — ' + parts.join('，') + '。' +
        (used ? '中国按单代购二手车，购买前全面检测。' : '中国市场按单代购。') +
        '全包价格已含物流、清关、SBKTS/EPTS 认证及服务费，30–60 天送达俄罗斯任意城市，全程提供照片和视频报告。';
    }
    return car.name + (car.year ? ' (' + car.year + ')' : '') + ' — ' + parts.join(', ') + '. ' +
      (used ? 'Used car to order from China, fully inspected before purchase. ' : 'To order from the Chinese market. ') +
      'The all-in price includes logistics, customs clearance, SBKTS/EPTS and our fee. Delivery to any city in Russia in 30–60 days, with photo and video reports at every stage.';
  };

  A.carCard = function (car) {
    const used = car.cond === 'used';
    const stock = !!car.stock;
    const priceNote = stock ? 'в наличии, под ключ' : used ? 'с пробегом, под ключ' : 'новый, под ключ';
    const fav = A.favs.has(car.slug);
    const hot = hotInfo(car);
    const specs = stock
      ? `<li><span>Город</span><b>${car.stockCity || 'Россия'}</b></li>
         ${car.mileage ? `<li><span>Пробег</span><b>${Number(car.mileage).toLocaleString('ru-RU')} км</b></li>` : `<li><span>Мощность</span><b>${car.power}</b></li>`}
         ${car.vin ? `<li><span>VIN</span><b class="vinval">${car.vin}</b></li>` : `<li><span>Год</span><b>${car.year}</b></li>`}`
      : `<li><span>Мощность</span><b>${car.power}</b></li>
         ${used && car.mileage ? `<li><span>Пробег</span><b>${Number(car.mileage).toLocaleString('ru-RU')} км</b></li>` : `<li><span>Привод</span><b>${car.drive}</b></li>`}
         ${car.range !== '—' ? `<li><span>Запас хода</span><b>${car.range}</b></li>` : `<li><span>Год</span><b>${car.year}</b></li>`}`;
    return `<article class="car-card reveal">
      <a href="${A.carUrl(car)}">${A.carVisual(car)}</a>
      <div class="car-card-body">
        <div class="car-card-head">
          <h3>${car.name}</h3>
          <button class="fav-btn${fav ? ' on' : ''}" data-fav="${car.slug}" aria-label="В избранное" title="В избранное">${ICONS.heart}</button>
        </div>
        <div class="car-sub">${car.body} · ${car.fuel}</div>
        ${hot ? `<div class="hot-badge">Горящий лот · экономия ${(hot.oldPrice - car.price).toFixed(1).replace('.', ',')} млн ₽</div>` : ''}
        <ul class="car-specs">${specs}</ul>
        ${stock ? '<div class="stock-today">Можно забрать сегодня</div>' : ''}
        <div class="car-price-row">
          <div class="car-price num">от ${car.price.toFixed(1).replace('.', ',')} млн ₽${hot ? `<del>${hot.oldPrice.toFixed(1).replace('.', ',')} млн ₽</del><small data-hot-deadline="${hot.deadline.toISOString()}">до конца предложения</small>` : `<small>${priceNote}</small>`}</div>
        </div>
        ${stock
          ? `<a class="btn btn-red btn-sm" data-goal="reserve_click" href="${A.carUrl(car)}">Забронировать</a>`
          : `<a class="btn btn-ghost btn-sm" href="${A.carUrl(car)}">Подробнее</a>`}
      </div>
    </article>`;
  };

  function updateHotCountdowns() {
    document.querySelectorAll('[data-hot-deadline]').forEach((el) => {
      const left = new Date(el.dataset.hotDeadline).getTime() - Date.now();
      if (left <= 0) { el.textContent = 'предложение завершено'; return; }
      const days = Math.floor(left / 864e5);
      const hours = Math.floor((left % 864e5) / 36e5);
      const mins = Math.floor((left % 36e5) / 6e4);
      el.textContent = days ? `осталось ${days} д. ${hours} ч.` : `осталось ${hours} ч. ${mins} мин.`;
    });
  }

  function renderHotLots() {
    const root = document.querySelector('[data-hot-lots]');
    if (!root) return;
    const cars = A.CARS.filter((car) => hotInfo(car)).slice(0, 5);
    root.hidden = !cars.length;
    const grid = root.querySelector('[data-hot-grid]');
    if (grid && cars.length) grid.innerHTML = cars.map(A.carCard).join('');
    updateHotCountdowns();
  }

  /* ---------- Короткая форма подбора ---------- */
  function renderQuizModal() {
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.id = 'quiz-modal';
    el.innerHTML = `<div class="modal">
      <button class="modal-close" aria-label="Закрыть">✕</button>
      <div id="quiz-body"></div>
    </div>`;
    document.body.append(el);

    const body = el.querySelector('#quiz-body');
    function draw(carName) {
      body.innerHTML = `
        <h3 class="h3" style="margin-bottom:8px">Получить расчёт автомобиля</h3>
        <p class="muted" style="font-size:14px;margin-bottom:18px">Укажите модель и контакт. Менеджер уточнит детали и пришлёт расчёт «под ключ».</p>
        <form class="form-grid" id="quiz-form">
          <div class="form-field"><label>Автомобиль</label><input name="car" value="${escBlog(carName)}" placeholder="Марка и модель или «пока выбираю»" required></div>
          <div class="form-field"><label>Телефон или Telegram</label><input name="phone" type="text" inputmode="text" autocomplete="tel" placeholder="+7 900 000-00-00 или @username" required></div>
          <div class="form-field"><label>Город доставки <span class="muted">(необязательно)</span></label><input name="city" autocomplete="address-level2" placeholder="Например, Москва"></div>
          <button class="btn btn-red btn-block" type="submit">Получить расчёт</button>
          <div class="form-note">Нажимая кнопку, вы соглашаетесь с <a href="privacy.html">политикой конфиденциальности</a>.</div>
        </form>`;
      const form = body.querySelector('#quiz-form');
      ensureConsent(form);
      bindFormAnalytics(form, carName);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const contact = form.phone.value.trim();
        if (!validContact(contact)) { form.phone.classList.add('error'); form.phone.focus(); return; }
        if (!consentOK(form)) return;
        const result = await submitLead({
          name: '—', phone: contact, city: form.city.value.trim(), budget: 'Короткая форма',
          brand: form.car.value.trim(), body: '', fuel: '', car_name: form.car.value.trim(),
        }, form);
        if (!result.ok) { showLeadError(form); return; }
        body.innerHTML = successHTML('Заявка отправлена!', 'Менеджер свяжется с вами и пришлёт расчёт «под ключ».');
      });
    }

    function open(carName) {
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      draw(carName || '');
      A.goal('quiz_open', A.analyticsContext(carName));
    }
    function close() { el.classList.remove('open'); document.body.style.overflow = ''; }
    el.querySelector('.modal-close').addEventListener('click', close);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-quiz-open]');
      if (t) {
        e.preventDefault();
        const carName = t.dataset.car || document.querySelector('form[data-brand]')?.dataset.brand || '';
        open(carName);
      }
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
  function validContact(v) {
    const value = String(v || '').trim();
    return value.replace(/\D/g, '').length >= 10 || /^@[A-Za-z0-9_]{5,32}$/.test(value);
  }
  const validPhone = validContact;

  function bindFormAnalytics(form, carName) {
    if (!form || form.dataset.analyticsBound) return;
    form.dataset.analyticsBound = 'true';
    const context = () => A.analyticsContext(carName || form.dataset.brand || form.querySelector('[name=car]')?.value);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        A.goal('lead_form_view', context());
        observer.disconnect();
      }, { threshold: 0.2 });
      observer.observe(form);
    } else {
      A.goal('lead_form_view', context());
    }
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      A.goal('lead_form_start', context());
    };
    form.addEventListener('input', start, { passive: true });
    form.addEventListener('change', start, { passive: true });
  }

  function showLeadError(form) {
    let message = form.querySelector('[data-lead-error]');
    if (!message) {
      message = document.createElement('div');
      message.dataset.leadError = '';
      message.className = 'form-note error';
      form.appendChild(message);
    }
    message.innerHTML = `Не удалось отправить заявку. Данные сохранены в форме — повторите попытку или <a href="${C.telegram}" target="_blank" rel="noopener">напишите нам в Telegram</a>.`;
  }

  let leadSubmitted = false;
  async function submitLead(payload, form) {
    const button = form && form.querySelector('button[type=submit]');
    if (button) button.disabled = true;
    const formCar = form && form.querySelector('[name=car]');
    const explicitBrand = form && form.dataset.brand;
    const payloadBrand = String(payload.brand || '').trim();
    const carName = String(payload.car_name || (formCar && formCar.value) || explicitBrand ||
      (payloadBrand && !payloadBrand.startsWith('#') ? payloadBrand : '')).trim();
    const context = A.analyticsContext(carName);
    const requestPayload = { ...payload, ...context };
    try {
      const response = await fetch(API_BASE + '/api/selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      if (response.status !== 201) throw new Error(`Lead API returned ${response.status}`);
      leadSubmitted = true;
      A.goal('lead_submit_success', context);
      A.goal('lead_submit', context);
      return { ok: true };
    } catch (err) {
      console.warn('Lead API unavailable', err);
      A.goal('lead_submit_error', context);
      if (button) button.disabled = false;
      return { ok: false, error: err };
    }
  }
  A.submitLead = submitLead;
  A.validPhone = validPhone;
  A.validContact = validContact;
  A.bindFormAnalytics = bindFormAnalytics;
  A.showLeadError = showLeadError;
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
      '<span>Я согласен на обработку <a href="soglasie.html" target="_blank" rel="noopener">персональных данных</a></span>';
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
      const contactInput = f.querySelector('input[name=phone]');
      if (contactInput) {
        contactInput.type = 'text';
        contactInput.inputMode = 'text';
        contactInput.placeholder = 'Телефон или @Telegram';
      }
      if (window.matchMedia('(max-width: 620px)').matches) {
        const nameInput = f.querySelector('[name=name]');
        if (nameInput) {
          nameInput.required = false;
          nameInput.value = nameInput.value || '—';
          const field = nameInput.closest('.form-field');
          if (field) field.hidden = true;
        }
        ['trim', 'comment', 'messenger'].forEach((fieldName) => {
          const input = f.querySelector(`[name=${fieldName}]`);
          if (input) {
            input.required = false;
            const field = input.closest('.form-field');
            if (field) field.hidden = true;
          }
        });
        if (!f.querySelector('[name=city]')) {
          const cityField = document.createElement('div');
          cityField.className = 'form-field';
          cityField.innerHTML = '<input name="city" autocomplete="address-level2" placeholder="Город доставки (необязательно)">';
          const submit = f.querySelector('button[type=submit]');
          if (submit) f.insertBefore(cityField, submit);
        }
      }
      ensureConsent(f);
      bindFormAnalytics(f, f.dataset.brand);
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messenger = f.messenger ? f.messenger.value : '';
        const comment = (f.querySelector('[name=comment]') && f.querySelector('[name=comment]').value || '').trim();
        const car = (f.querySelector('[name=car]') && f.querySelector('[name=car]').value || '').trim();
        const trim = (f.querySelector('[name=trim]') && f.querySelector('[name=trim]').value || '').trim();
        const bodyParts = [];
        if (car) bodyParts.push('Автомобиль: ' + car);
        if (trim) bodyParts.push('Комплектация: ' + trim);
        if (comment) bodyParts.push(comment);
        if (messenger) bodyParts.push('связь: ' + messenger);
        const payload = {
          name: (f.name && f.name.value || '').trim() || '—',
          phone: (f.phone && f.phone.value || '').trim(),
          city: (f.city && f.city.value || '').trim(),
          budget: f.dataset.leadForm || 'заявка с сайта',
          brand: (f.dataset.brand || ''),
          body: bodyParts.join(' · '),
          fuel: '',
        };
        if (!validPhone(payload.phone)) { f.phone.classList.add('error'); return; }
        if (!consentOK(f)) return;
        const result = await submitLead(payload, f);
        if (!result.ok) { showLeadError(f); return; }
        f.innerHTML = successHTML(
          f.dataset.successTitle || 'Спасибо, заявка принята!',
          f.dataset.successMessage || 'Мы перезвоним в ближайшее рабочее время (ежедневно 9:00–21:00 мск).'
        );
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
      q.setAttribute('aria-expanded', 'false');
      q.addEventListener('click', () => {
        const open = q.parentElement.classList.toggle('open');
        q.setAttribute('aria-expanded', String(open));
      });
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
        A.CATALOG_FROM_API = true;
      }
    } catch (e) { /* сервер молчит — показываем встроенный каталог */ }
  }

  /* Городские страницы раньше содержали фиксированный список встроенных
     моделей. Если такой модели уже нет в рабочем каталоге, Google всё равно
     мог находить её через fallback. Всегда заменяем этот блок актуальными
     данными API, а при недоступном API оставляем только ссылку на каталог. */
  function renderGeoCatalog() {
    const grid = document.querySelector('[data-geo-cars]');
    if (!grid) return;
    if (A.CATALOG_FROM_API) {
      grid.innerHTML = A.CARS.slice(0, 6).map(A.carCard).join('');
      return;
    }
    grid.innerHTML = '<div class="cell sp-12"><p>Актуальные модели и цены доступны в каталоге.</p>' +
      '<a class="btn btn-white" href="catalog.html">Открыть каталог</a></div>';
  }

  /* ---------- Exit-intent: desktop, один раз за вкладку ---------- */
  function initExitIntent() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    try { if (sessionStorage.getItem('inavto_exit_seen')) return; } catch (e) { /* — */ }
    let armed = false;
    const arm = () => { armed = true; };
    const timer = setTimeout(arm, 8000);
    document.addEventListener('mouseout', (e) => {
      if (!armed || e.relatedTarget || e.clientY > 8) return;
      if (document.querySelector('.modal-backdrop.open, .gallery-lightbox.open, .telegram-subscribe-overlay.open')) return;
      armed = false;
      clearTimeout(timer);
      try { sessionStorage.setItem('inavto_exit_seen', '1'); } catch (err) { /* — */ }
      const overlay = document.createElement('div');
      overlay.className = 'exit-overlay open';
      overlay.innerHTML = `<div class="exit-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-title"><button class="modal-close" type="button" data-exit-close aria-label="Закрыть">✕</button><div class="overline">Бесплатная консультация</div><h2 class="h2" id="exit-title">Уходите без расчёта?</h2><p class="lead">Напишите модель и бюджет — менеджер пришлёт актуальные варианты и цены «под ключ» в Telegram.</p><div class="exit-actions"><a class="btn btn-red" href="${C.telegram}" target="_blank" rel="noopener" data-goal="exit_tg">Получить расчёт в Telegram</a><button class="btn btn-ghost" type="button" data-exit-quiz>Подобрать на сайте</button></div><p class="form-note">Без рассылок и выдуманного дефицита. Ответим в рабочее время.</p></div>`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      A.goal('exit_view');
    });
    document.addEventListener('click', (e) => {
      const overlay = e.target.closest('.exit-overlay');
      if (!overlay) return;
      if (e.target.closest('[data-exit-close]') || e.target === overlay) {
        overlay.remove(); document.body.style.overflow = ''; return;
      }
      if (e.target.closest('[data-exit-quiz]')) {
        overlay.remove(); document.body.style.overflow = '';
        const quiz = document.querySelector('[data-quiz-open]');
        if (quiz) quiz.click();
      }
    });
  }

  /* ---------- Попап подписки на Telegram ---------- */
  function initTelegramSubscribePopup() {
    const seenKey = 'inavto_tg_subscribe_seen';
    try { if (sessionStorage.getItem(seenKey)) return; } catch (e) { /* приватный режим */ }

    const overlay = document.createElement('div');
    overlay.className = 'telegram-subscribe-overlay';
    overlay.innerHTML = `
      <section class="telegram-subscribe-dialog" role="dialog" aria-modal="true" aria-labelledby="telegram-subscribe-title">
        <button class="telegram-subscribe-close" type="button" aria-label="Закрыть объявление">×</button>
        <img class="telegram-subscribe-image" src="/img/telegram-channel.webp" alt="Telegram-канал INAVTO ASIA" width="1200" height="537">
        <div class="telegram-subscribe-copy">
          <div class="overline">INAVTO ASIA в Telegram</div>
          <h2 class="h2" id="telegram-subscribe-title">Подпишитесь на Telegram</h2>
          <p>Цены, подборки и реальные автомобили из Китая.</p>
          <a class="btn btn-red" href="https://t.me/Inavtoasia" target="_blank" rel="noopener" data-telegram-subscribe>Подписаться на Telegram</a>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    const close = (goal) => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      try { sessionStorage.setItem(seenKey, '1'); } catch (e) { /* приватный режим */ }
      if (goal) A.goal(goal);
    };
    const open = () => {
      if (document.querySelector('.modal-backdrop.open, .exit-overlay.open, .gallery-lightbox.open')) return;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      A.goal('telegram_subscribe_popup_view');
    };

    overlay.querySelector('.telegram-subscribe-close').addEventListener('click', () => close('telegram_subscribe_popup_close'));
    overlay.querySelector('[data-telegram-subscribe]').addEventListener('click', () => close('telegram_subscribe_popup_click'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close('telegram_subscribe_popup_close'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) close('telegram_subscribe_popup_close'); });
    window.setTimeout(open, 1600);
  }

  /* ---------- Старт ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    await loadRemoteCatalog();
    renderHeader();
    renderFooter();
    renderQuizModal();
    renderBlogArticleEnd();
    if (typeof window.INAVTO_PAGE_INIT === 'function') window.INAVTO_PAGE_INIT();
    renderDeliveryStoryPage();
    renderGeoCatalog();
    // страницы (car.html) выставляют title после старта переводчика — доводим вручную
    if (window.INAVTO_I18N && window.INAVTO_I18N.tr) {
      const tt = window.INAVTO_I18N.tr(document.title);
      if (tt) document.title = tt;
    }
    bindLeadForms();
    initReveal();
    initFaq();
    initParallax();
    initCountUp();
    initMagnetic();
    initHeroReveal();
    initCookie();
    renderHotLots();
    updateHotCountdowns();
    setInterval(updateHotCountdowns, 60000);
    initExitIntent();
    initTelegramSubscribePopup();
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
