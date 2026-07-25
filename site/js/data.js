/* INAVTO ASIA — данные каталога.
   Цены «под ключ» ориентировочные («от»), обновляются менеджером. */

window.INAVTO = window.INAVTO || {};

window.INAVTO.CONTACTS = {
  phone: '+7 967 646-36-29',
  phoneHref: 'tel:+79676463629',
  telegram: 'https://t.me/Dilshat1985',
  whatsapp: 'https://wa.me/79676463629',
  email: 'inavto.asia@yandex.ru',
};

window.INAVTO.CARS = [
  /* ---------- Китай — новые ---------- */
  {
    slug: 'zeekr-001', brand: 'Zeekr', name: 'Zeekr 001', country: 'china',
    body: 'Лифтбек', fuel: 'Электро', power: '544 л.с.', drive: 'Полный',
    range: '656 км', battery: '95 кВт·ч', price: 4.6, year: 2025,
    tags: ['electro', 'awd'], grad: ['#20304c', '#0d1524'],
    desc: 'Флагманский электрический лифтбек Zeekr: динамика спорткара, запас хода 600+ км и премиальный салон. Одна из самых популярных моделей под заказ из Китая.'
  },
  {
    slug: 'zeekr-7x', brand: 'Zeekr', name: 'Zeekr 7X', country: 'china',
    body: 'Кроссовер', fuel: 'Электро', power: '421 л.с.', drive: 'Задний / Полный',
    range: '705 км', battery: '100 кВт·ч', price: 4.2, year: 2025,
    tags: ['electro', 'suv'], grad: ['#2c3a55', '#111827'],
    desc: 'Среднеразмерный электрический кроссовер на 800-вольтовой платформе: зарядка 10–80% за 16 минут, богатое оснащение уже в базе.'
  },
  {
    slug: 'lixiang-l7', brand: 'Li Auto', name: 'Lixiang L7', country: 'china',
    body: 'Кроссовер', fuel: 'Гибрид (EREV)', power: '449 л.с.', drive: 'Полный',
    range: '1315 км (суммарно)', battery: '42,8 кВт·ч', price: 4.9, year: 2025,
    tags: ['hybrid', 'suv', 'family'], grad: ['#3a3f4a', '#15181f'],
    desc: 'Пятиместный семейный кроссовер с последовательным гибридом: едет как электромобиль, а бензиновый генератор снимает страх розетки. Хит продаж в Китае.'
  },
  {
    slug: 'lixiang-l9', brand: 'Li Auto', name: 'Lixiang L9', country: 'china',
    body: 'Кроссовер', fuel: 'Гибрид (EREV)', power: '449 л.с.', drive: 'Полный',
    range: '1412 км (суммарно)', battery: '44,5 кВт·ч', price: 6.4, year: 2025,
    tags: ['hybrid', 'suv', 'family', '7seats'], grad: ['#2f3542', '#101319'],
    desc: 'Флагман Li Auto: шестиместный салон с креслами-капитанами, три экрана, холодильник — полноценная замена премиальным европейским SUV.'
  },
  {
    slug: 'byd-song-plus', brand: 'BYD', name: 'BYD Song Plus DM-i', country: 'china',
    body: 'Кроссовер', fuel: 'Гибрид (PHEV)', power: '218 л.с.', drive: 'Передний',
    range: '1200 км (суммарно)', battery: '18,3 кВт·ч', price: 2.9, year: 2025,
    tags: ['hybrid', 'suv', 'budget'], grad: ['#37424e', '#141a20'],
    desc: 'Самый массовый гибридный кроссовер Китая: расход 4–5 л на 100 км, просторный салон и лучшая цена в классе.'
  },
  {
    slug: 'byd-seal', brand: 'BYD', name: 'BYD Seal', country: 'china',
    body: 'Седан', fuel: 'Электро', power: '530 л.с.', drive: 'Полный',
    range: '650 км', battery: '82,5 кВт·ч', price: 3.6, year: 2025,
    tags: ['electro', 'sedan'], grad: ['#1f3a4d', '#0c161e'],
    desc: 'Спортивный электроседан на платформе e-Platform 3.0 с ячейками Blade Battery: разгон до сотни за 3,8 секунды.'
  },
  {
    slug: 'geely-monjaro', brand: 'Geely', name: 'Geely Monjaro', country: 'china',
    body: 'Кроссовер', fuel: 'Бензин', power: '238 л.с.', drive: 'Полный',
    range: '—', battery: '—', price: 3.3, year: 2025,
    tags: ['petrol', 'suv'], grad: ['#41454f', '#171a20'],
    desc: 'Флагманский бензиновый кроссовер Geely на платформе Volvo CMA: 2.0 турбо, полный привод BorgWarner, тихий и богатый салон.'
  },
  {
    slug: 'xiaomi-su7', brand: 'Xiaomi', name: 'Xiaomi SU7', country: 'china',
    body: 'Седан', fuel: 'Электро', power: '673 л.с.', drive: 'Полный',
    range: '800 км', battery: '101 кВт·ч', price: 4.8, year: 2025,
    tags: ['electro', 'sedan'], grad: ['#3d3347', '#151119'],
    desc: 'Электроседан от Xiaomi, ставший главной новинкой китайского авторынка: экосистема HyperOS, автопилот и дизайн уровня суперкаров.'
  },
  {
    slug: 'aito-m7', brand: 'AITO', name: 'AITO M7', country: 'china',
    body: 'Кроссовер', fuel: 'Гибрид (EREV)', power: '449 л.с.', drive: 'Полный',
    range: '1300 км (суммарно)', battery: '40 кВт·ч', price: 4.4, year: 2025,
    tags: ['hybrid', 'suv', 'family'], grad: ['#33404c', '#121a20'],
    desc: 'Кроссовер альянса Huawei и Seres: интеллектуальный автопилот ADS, HarmonyOS в салоне и гибридная силовая установка.'
  },
  {
    slug: 'avatr-11', brand: 'Avatr', name: 'Avatr 11', country: 'china',
    body: 'Кроссовер-купе', fuel: 'Электро', power: '578 л.с.', drive: 'Полный',
    range: '680 км', battery: '116 кВт·ч', price: 5.2, year: 2025,
    tags: ['electro', 'suv'], grad: ['#403040', '#161018'],
    desc: 'Совместный проект Changan, Huawei и CATL: футуристичный дизайн, батарея 116 кВт·ч и интеллект Huawei на борту.'
  },
  {
    slug: 'tank-500', brand: 'Tank', name: 'Tank 500', country: 'china',
    body: 'Внедорожник', fuel: 'Гибрид (HEV)', power: '354 л.с.', drive: 'Полный',
    range: '—', battery: '—', price: 5.0, year: 2025,
    tags: ['hybrid', 'suv', 'offroad', '7seats'], grad: ['#3a3d38', '#141612'],
    desc: 'Рамный внедорожник премиум-класса: гибрид 2.0T + электромотор, блокировки, семь мест и салон бизнес-уровня.'
  },
  {
    slug: 'chery-tiggo-8-pro-max', brand: 'Chery', name: 'Chery Tiggo 8 Pro Max', country: 'china',
    body: 'Кроссовер', fuel: 'Бензин', power: '197 л.с.', drive: 'Полный',
    range: '—', battery: '—', price: 2.6, year: 2025,
    tags: ['petrol', 'suv', 'budget', '7seats'], grad: ['#41404a', '#16151c'],
    desc: 'Семиместный кроссовер с лучшим соотношением цены и оснащения: панорамная крыша, два экрана 12,3", полный привод.'
  },
  {
    slug: 'haval-h6', brand: 'Haval', name: 'Haval H6', country: 'china',
    body: 'Кроссовер', fuel: 'Бензин', power: '192 л.с.', drive: 'Передний / Полный',
    range: '—', battery: '—', price: 2.3, year: 2025,
    tags: ['petrol', 'suv', 'budget'], grad: ['#39424b', '#131a1f'],
    desc: 'Бестселлер китайского рынка в новом поколении: экономичный турбомотор, просторный салон и цена заметно ниже дилерской в РФ.'
  },
  {
    slug: 'voyah-free', brand: 'Voyah', name: 'Voyah Free', country: 'china',
    body: 'Кроссовер', fuel: 'Гибрид (EREV)', power: '694 л.с.', drive: 'Полный',
    range: '1200 км (суммарно)', battery: '43 кВт·ч', price: 4.7, year: 2025,
    tags: ['hybrid', 'suv'], grad: ['#2e3c4e', '#101722'],
    desc: 'Премиальный кроссовер Dongfeng: пневмоподвеска, 694 л.с. в гибридной версии и богатая базовая комплектация.'
  },
  {
    slug: 'hongqi-hs5', brand: 'Hongqi', name: 'Hongqi HS5', country: 'china',
    body: 'Кроссовер', fuel: 'Бензин', power: '245 л.с.', drive: 'Полный',
    range: '—', battery: '—', price: 3.4, year: 2025,
    tags: ['petrol', 'suv'], grad: ['#43323a', '#181114'],
    desc: 'Представительский кроссовер первой автомобильной марки Китая: строгий дизайн, качественные материалы, тихий салон.'
  },
  {
    slug: 'geely-galaxy-e8', brand: 'Geely', name: 'Geely Galaxy E8', country: 'china',
    body: 'Седан', fuel: 'Электро', power: '475 л.с.', drive: 'Полный',
    range: '665 км', battery: '76 кВт·ч', price: 3.5, year: 2025,
    tags: ['electro', 'sedan'], grad: ['#243a4e', '#0d1622'],
    desc: 'Электрический флагман линейки Galaxy: экран во всю панель 45", 800-вольтовая архитектура, отличная управляемость.'
  },

];

/* Выданные автомобили (соцдоказательство).
   Формат записи: { model: 'Zeekr 001', city: 'Казань', days: 43,
                    date: 'июнь 2026', photo: 'img/delivered/zeekr-001-kazan.webp' }
   Фото кладём в site/img/delivered/. Пока массив пуст — блок на главной скрыт,
   страница vydannye-avto.html показывает макеты с пометкой. */
window.INAVTO.DELIVERED = [];

/* Этапы доставки для трекера */
window.INAVTO.STAGES = [
  { key: 'contract', t: 'Договор', s: 'фиксируем цену и сроки' },
  { key: 'buyout', t: 'Выкуп авто', s: 'проверка и оплата по инвойсу' },
  { key: 'port', t: 'Порт отправления', s: 'погрузка и страхование' },
  { key: 'transit', t: 'В пути', s: 'море / ж/д, фотоотчёты' },
  { key: 'customs', t: 'Таможня', s: 'растаможка, утильсбор' },
  { key: 'lab', t: 'СБКТС и ЭПТС', s: 'сертификация' },
  { key: 'done', t: 'Выдача', s: 'вручение в вашем городе' },
];
