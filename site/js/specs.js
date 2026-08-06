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
    ['vin', 'VIN'],
  ]],
  ['engine', 'Двигатель', [
    ['type', 'Тип двигателя'],
    ['volume', 'Объём двигателя'],
    ['power', 'Мощность'],
    ['torque', 'Крутящий момент'],
    ['battery', 'Батарея'],
    ['range', 'Запас хода'],
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

/* Автокарточка: собираем разделы из данных, которые уже есть у машины
   в каталоге. Ничего не выдумываем — только то, что заполнено. */
window.INAVTO.autoSpecs = function (car) {
  if (!car) return {};
  var val = function (v) { return v && v !== '—' ? String(v) : ''; };
  var fuel = val(car.fuel);
  var isEv = /электро/i.test(fuel);
  var isHybrid = /гибрид/i.test(fuel);
  var tags = car.tags || [];

  var engineType = isEv ? 'Электрический'
    : /EREV/i.test(fuel) ? 'Гибрид, последовательный (EREV)'
    : /PHEV/i.test(fuel) ? 'Гибрид, подключаемый (PHEV)'
    : isHybrid ? 'Гибрид'
    : /дизель/i.test(fuel) ? 'Дизельный'
    : fuel ? 'Бензиновый' : '';
  var fuelType = isEv ? 'Электричество' : isHybrid ? 'Бензин + электричество' : fuel;

  /* «Zeekr 7X» + марка «Zeekr» → модель «7X» */
  var model = val(car.name);
  if (car.brand && model.toLowerCase().indexOf(String(car.brand).toLowerCase()) === 0) {
    model = model.slice(String(car.brand).length).trim() || model;
  }

  var mileage = '';
  if (car.cond === 'used') {
    mileage = car.mileage ? Number(car.mileage).toLocaleString('ru-RU') + ' км' : 'с пробегом';
  } else if (car.cond) {
    mileage = 'новый автомобиль';
  }

  return {
    basic: {
      brand: val(car.brand),
      model: model,
      year: car.year ? String(car.year) : '',
      country: 'Китай',
      body: val(car.body),
      seats: tags.indexOf('7seats') > -1 ? '7' : '',
      mileage: mileage,
      vin: val(car.vin),
    },
    engine: {
      type: engineType,
      power: val(car.power),
      battery: val(car.battery),
      range: val(car.range),
      fuel: fuelType,
    },
    trans: { drive: val(car.drive) },
    dims: {},
  };
};

/* HTML подробной карточки. Показываем всё, что известно: сначала данные
   каталога, поверх — то, что заполнено вручную в админке. Пустые поля
   и пустые группы не выводятся. */
window.INAVTO.specSheetHTML = function (car, fallbackText) {
  var A = window.INAVTO;
  var auto = A.autoSpecs(car);
  var manual = (car && car.specs) || {};
  var s = {
    options: manual.options,
    text: manual.text,
  };
  A.SPEC_GROUPS.forEach(function (g) {
    var merged = {};
    var a = auto[g[0]] || {};
    var m = manual[g[0]] || {};
    g[2].forEach(function (f) {
      var v = m[f[0]] != null && String(m[f[0]]).trim() !== '' ? m[f[0]] : a[f[0]];
      if (v != null && String(v).trim() !== '') merged[f[0]] = v;
    });
    s[g[0]] = merged;
  });
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
