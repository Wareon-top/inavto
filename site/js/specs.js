/* INAVTO ASIA — подробная карточка характеристик автомобиля.
   Единый источник правды: список полей, список опций и вёрстка.
   Используется и на сайте (car.html), и генератором статических
   страниц (build-pages.mjs), и как справочник полей для админки. */

window.INAVTO = window.INAVTO || {};

/* Группы полей: [ключ группы, заголовок, [[ключ поля, подпись], …]] */
window.INAVTO.SPEC_GROUPS = [
  ['basic', 'Основные характеристики', [
    ['brand', 'Марка'],
    ['model', 'Модель'],
    ['trim', 'Комплектация'],
    ['year', 'Год выпуска'],
    ['country', 'Страна производства'],
    ['body', 'Тип кузова'],
    ['seats', 'Количество мест'],
    ['colorBody', 'Цвет кузова'],
    ['colorInterior', 'Цвет салона'],
    ['mileage', 'Пробег'],
  ]],
  ['engine', 'Двигатель', [
    ['type', 'Тип двигателя'],
    ['volume', 'Объём двигателя'],
    ['power', 'Мощность'],
    ['torque', 'Крутящий момент'],
    ['eco', 'Экологический стандарт'],
    ['fuel', 'Тип топлива'],
    ['consumption', 'Средний расход топлива'],
    ['tank', 'Объём топливного бака'],
  ]],
  ['trans', 'Трансмиссия', [
    ['gearbox', 'Коробка передач'],
    ['drive', 'Привод'],
    ['accel', 'Разгон 0–100 км/ч'],
    ['maxSpeed', 'Максимальная скорость'],
  ]],
  ['dims', 'Габариты', [
    ['length', 'Длина'],
    ['width', 'Ширина'],
    ['height', 'Высота'],
    ['wheelbase', 'Колёсная база'],
    ['clearance', 'Клиренс'],
    ['weight', 'Снаряжённая масса'],
    ['tires', 'Размер шин'],
    ['trunk', 'Объём багажника'],
  ]],
];

/* Опции комплектации — отмечаются галочками */
window.INAVTO.CAR_OPTIONS = [
  'Светодиодная оптика',
  'Дневные ходовые огни',
  'Панорамная крыша / люк',
  'Кожаный салон',
  'Электропривод передних сидений',
  'Подогрев передних сидений',
  'Вентиляция сидений',
  'Память сидений',
  'Многофункциональный руль',
  'Цифровая приборная панель',
  'Мультимедийная система',
  'Apple CarPlay / Android Auto',
  'Беспроводная зарядка смартфона',
  'Климат-контроль',
  'Камера 360°',
  'Передние и задние парктроники',
  'Адаптивный круиз-контроль',
  'Система удержания в полосе',
  'Контроль слепых зон',
  'Система автоматического экстренного торможения',
  'Электропривод багажника',
  'Бесключевой доступ',
  'Кнопка запуска двигателя',
  'Атмосферная подсветка салона',
];

/* HTML подробной карточки. Пустые поля и пустые группы не выводятся,
   поэтому карточку можно заполнять постепенно. */
window.INAVTO.specSheetHTML = function (car, fallbackText) {
  var A = window.INAVTO;
  var s = car && car.specs;
  if (!s) return '';
  var esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var out = '';

  A.SPEC_GROUPS.forEach(function (g) {
    var data = s[g[0]] || {};
    var rows = g[2]
      .filter(function (f) { return String(data[f[0]] == null ? '' : data[f[0]]).trim() !== ''; })
      .map(function (f) {
        return '<div class="spec-item"><span>' + esc(f[1]) + '</span><b>' + esc(data[f[0]]) + '</b></div>';
      });
    if (!rows.length) return;
    out += '<div class="divider-label" style="margin:28px 0 14px">' + esc(g[1]) + '</div>' +
      '<div class="spec-grid">' + rows.join('') + '</div>';
  });

  var opts = Array.isArray(s.options) ? s.options.filter(Boolean) : [];
  if (opts.length) {
    out += '<div class="divider-label" style="margin:28px 0 14px">Комплектация</div>' +
      '<ul class="opt-list">' + opts.map(function (o) {
        return '<li>' + esc(o) + '</li>';
      }).join('') + '</ul>';
  }

  /* Если отдельный текст не заполнен — берём обычное описание машины */
  var text = (s.text || fallbackText || '').trim();
  if (text) {
    out += '<div class="divider-label" style="margin:28px 0 14px">Описание</div>' +
      '<div class="prose spec-text">' + text.split(/\n{2,}/).map(function (p) {
        return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
      }).join('') + '</div>';
  }

  return out;
};
