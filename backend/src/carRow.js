/* Строка каталога из базы → объект машины в формате сайта (js/data.js).
   Общий код для API каталога и генератора статических страниц. */

export const rowToCar = (r) => ({
  slug: r.slug,
  brand: r.brand,
  name: r.name,
  country: 'china',
  body: r.body,
  fuel: r.fuel,
  power: r.power,
  volume: r.engine_volume || '',
  drive: r.drive,
  range: r.range || '—',
  battery: r.battery || '—',
  price: r.price_rub,
  priceCny: r.price_cny || 0,
  priceUsd: r.price_usd || 0,
  year: r.year,
  tags: JSON.parse(r.tags || '[]'),
  grad: JSON.parse(r.grad || '["#37424e","#141a20"]'),
  desc: r.descr || '',
  descZh: r.descr_zh || '',
  descEn: r.descr_en || '',
  photos: JSON.parse(r.photos || '[]'),
  hidden: Boolean(r.hidden),
  sort: r.sort,
  cond: r.cond === 'used' ? 'used' : 'new',
  mileage: r.mileage || 0,
  specs: (() => { try { return r.specs ? JSON.parse(r.specs) : null } catch { return null } })(),
  stock: r.stock ? 1 : 0,
  stockCity: r.stock_city || '',
  vin: r.vin || '',
})

export default rowToCar
