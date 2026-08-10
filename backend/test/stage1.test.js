import assert from 'node:assert/strict'
import test from 'node:test'
import { rowToCar } from '../src/carRow.js'

const baseRow = {
  slug: 'test-car', brand: 'Test', name: 'Test Car', body: 'Кроссовер',
  fuel: 'Электро', power: '200 л.с.', drive: 'Полный', range: '500 км',
  battery: '80 кВт·ч', price_rub: 3.5, price_cny: 0, price_usd: 0,
  year: 2026, tags: '[]', grad: '["#111111","#222222"]', descr: '',
  photos: '[]', hidden: 0, sort: 100, cond: 'new', mileage: 0,
}

test('catalog row exposes a hot lot only with a real old price and deadline', () => {
  const car = rowToCar({ ...baseRow, hot_old_price: 4.1, hot_deadline: '2027-01-01T12:00' })
  assert.deepEqual(car.hot, { oldPrice: 4.1, deadline: '2027-01-01T12:00' })

  const invalid = rowToCar({ ...baseRow, hot_old_price: 3.5, hot_deadline: '2027-01-01T12:00' })
  assert.equal(invalid.hot, null)
})
