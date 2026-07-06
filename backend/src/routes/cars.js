import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { brand, fuel, maxPrice = 99999999, minPrice = 0 } = req.query
  let query = 'SELECT * FROM cars WHERE price <= ? AND price >= ?'
  const params = [Number(maxPrice), Number(minPrice)]

  if (brand) { query += ' AND brand = ?'; params.push(brand) }
  if (fuel) { query += ' AND fuel = ?'; params.push(fuel) }
  query += ' ORDER BY created_at DESC'

  const cars = db.prepare(query).all(...params)
  res.json(cars.map(formatCar))
})

router.get('/:id', (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id)
  if (!car) return res.status(404).json({ error: 'Not found' })
  res.json(formatCar(car, true))
})

router.post('/', (req, res) => {
  const { brand, model, year, price, mileage = 0, fuel = 'Бензин', engine, transmission, drive, color, vin, delivery_days, description, image, is_new = 0 } = req.body
  if (!brand || !model || !year || !price) return res.status(400).json({ error: 'Missing required fields' })

  const result = db.prepare(`
    INSERT INTO cars (brand, model, year, price, mileage, fuel, engine, transmission, drive, color, vin, delivery_days, description, image, is_new)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(brand, model, year, price, mileage, fuel, engine, transmission, drive, color, vin, delivery_days, description, image, is_new ? 1 : 0)

  res.status(201).json({ id: result.lastInsertRowid })
})

router.put('/:id', (req, res) => {
  const { brand, model, year, price, mileage, fuel, engine, transmission, drive, color, vin, delivery_days, description, image, is_new } = req.body
  db.prepare(`
    UPDATE cars SET brand=?, model=?, year=?, price=?, mileage=?, fuel=?, engine=?, transmission=?, drive=?, color=?, vin=?, delivery_days=?, description=?, image=?, is_new=?
    WHERE id=?
  `).run(brand, model, year, price, mileage, fuel, engine, transmission, drive, color, vin, delivery_days, description, image, is_new ? 1 : 0, req.params.id)
  res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM cars WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

function formatCar(car, detail = false) {
  const base = {
    id: car.id, brand: car.brand, model: car.model, year: car.year,
    price: car.price, mileage: car.mileage, fuel: car.fuel,
    image: car.image, isNew: Boolean(car.is_new)
  }
  if (!detail) return base
  return {
    ...base,
    engine: car.engine, transmission: car.transmission, drive: car.drive,
    color: car.color, vin: car.vin, deliveryDays: car.delivery_days,
    description: car.description,
    specs: [
      { label: 'Двигатель', value: car.engine || '—' },
      { label: 'КПП', value: car.transmission || '—' },
      { label: 'Привод', value: car.drive || '—' },
      { label: 'Цвет', value: car.color || '—' },
      { label: 'Пробег', value: car.mileage === 0 ? '0 км' : `${car.mileage.toLocaleString('ru')} км` },
      { label: 'Год', value: String(car.year) },
    ],
    priceBreakdown: {
      carPrice: Math.round(car.price * 0.65),
      customs: Math.round(car.price * 0.20),
      delivery: 150000,
      commission: Math.round(car.price * 0.09),
      total: car.price
    }
  }
}

export default router
