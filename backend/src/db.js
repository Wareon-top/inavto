import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DB_PATH || './data/inavto.db'
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    price INTEGER NOT NULL,
    mileage INTEGER DEFAULT 0,
    fuel TEXT DEFAULT 'Бензин',
    engine TEXT,
    transmission TEXT,
    drive TEXT,
    color TEXT,
    vin TEXT,
    delivery_days TEXT DEFAULT '45-60',
    description TEXT,
    image TEXT,
    is_new INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget TEXT,
    brand TEXT,
    body TEXT,
    fuel TEXT,
    name TEXT,
    phone TEXT,
    city TEXT,
    tg_user_id TEXT,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    car_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'search',
    note TEXT,
    eta TEXT,
    client_name TEXT,
    client_phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

// Seed demo cars if empty
const count = db.prepare('SELECT COUNT(*) as c FROM cars').get()
if (count.c === 0) {
  const insert = db.prepare(`
    INSERT INTO cars (brand, model, year, price, mileage, fuel, engine, transmission, drive, description, is_new)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const cars = [
    ['BYD', 'Han EV', 2024, 3200000, 0, 'Электро', 'Электро 517 л.с.', 'Авт.', 'Полный', 'Флагманский электромобиль BYD. Запас хода 605 км, разгон 3.9 сек.', 1],
    ['Chery', 'Tiggo 8 Pro', 2023, 2100000, 15000, 'Бензин', '1.6T 197 л.с.', 'Авт.', 'Передний', 'Семиместный кроссовер. Панорамная крыша, 12" экран, ADAS.', 0],
    ['Haval', 'Jolion', 2024, 1850000, 0, 'Гибрид', '1.5T + эл. 190 л.с.', 'Авт.', 'Передний', 'Компактный кроссовер. Гибридная установка, расход 5.6 л/100 км.', 1],
    ['Geely', 'Atlas Pro', 2023, 1950000, 8000, 'Бензин', '2.0T 238 л.с.', 'Авт.', 'Полный', 'Надёжный кроссовер с полным приводом. Богатая комплектация.', 0],
    ['Li Auto', 'L7', 2024, 4500000, 0, 'Гибрид', 'EREV 449 л.с.', 'Авт.', 'Задний', 'Люксовый гибридный SUV. Запас хода 1300 км. 6 экранов внутри.', 1],
    ['Hongqi', 'H5', 2023, 2800000, 5000, 'Бензин', '2.0T 224 л.с.', 'Авт.', 'Полный', 'Китайский премиум-бренд. Дерево, кожа, 4-зонный климат.', 0],
    ['Nio', 'ET5', 2024, 3900000, 0, 'Электро', 'Электро 489 л.с.', 'Авт.', 'Полный', 'Спортивный электрический седан. 0-100 км/ч за 4.3 сек. BaaS.', 1],
    ['Xpeng', 'P7', 2023, 3100000, 12000, 'Электро', 'Электро 316 л.с.', 'Авт.', 'Задний', 'Смарт-седан. XPILOT автопилот, запас хода 570 км.', 0],
  ]
  cars.forEach(c => insert.run(...c))
}

export default db
