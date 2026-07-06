import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CarCard from '../components/CarCard'
import { getCars } from '../utils/api'

const BRANDS = ['Все', 'Toyota', 'BYD', 'Chery', 'Haval', 'Geely', 'Li Auto', 'Nio', 'Xpeng', 'Hongqi', 'AITO']
const FUEL_TYPES = ['Все', 'Бензин', 'Гибрид', 'Электро', 'Дизель']

export default function Catalog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState(searchParams.get('brand') || 'Все')
  const [fuel, setFuel] = useState('Все')
  const [maxPrice, setMaxPrice] = useState(5000000)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadCars()
  }, [brand, fuel, maxPrice])

  async function loadCars() {
    setLoading(true)
    try {
      const data = await getCars({ brand: brand === 'Все' ? '' : brand, fuel: fuel === 'Все' ? '' : fuel, maxPrice })
      setCars(data)
    } catch {
      setCars(MOCK_CARS)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-bold text-lg">Каталог авто</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-[#C8102E]/20 border-[#C8102E]/50 text-[#C8102E]'
                : 'bg-white/5 border-white/20 text-gray-400'
            }`}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M1 3h14v1.5L9 10v5l-2-1V10L1 4.5V3z" />
            </svg>
            Фильтры
          </button>
        </div>

        {/* Brand scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                brand === b
                  ? 'bg-[#C8102E] border-[#C8102E] text-white'
                  : 'bg-transparent border-white/20 text-gray-400'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-[#12122a] border-b border-white/10 px-4 py-4 space-y-4">
          <div>
            <p className="text-gray-400 text-xs mb-2">Тип двигателя</p>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFuel(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    fuel === f
                      ? 'bg-[#C8102E] border-[#C8102E] text-white'
                      : 'bg-transparent border-white/20 text-gray-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-gray-400 text-xs">Бюджет до</p>
              <p className="text-white text-xs font-semibold">{(maxPrice / 1000000).toFixed(1)} млн ₽</p>
            </div>
            <input
              type="range"
              min={500000}
              max={10000000}
              step={100000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#C8102E]"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0.5 млн</span>
              <span>10 млн</span>
            </div>
          </div>
        </div>
      )}

      {/* Cars grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-56" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-white font-semibold">Ничего не найдено</p>
            <p className="text-gray-500 text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-3">Найдено: {cars.length} авто</p>
            <div className="grid grid-cols-2 gap-3">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} onClick={() => navigate(`/car/${car.id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const MOCK_CARS = [
  { id: 1, brand: 'BYD', model: 'Han EV', year: 2024, price: 3200000, mileage: 0, fuel: 'Электро', image: null, isNew: true },
  { id: 2, brand: 'Chery', model: 'Tiggo 8 Pro', year: 2023, price: 2100000, mileage: 15000, fuel: 'Бензин', image: null, isNew: false },
  { id: 3, brand: 'Haval', model: 'Jolion', year: 2024, price: 1850000, mileage: 0, fuel: 'Гибрид', image: null, isNew: true },
  { id: 4, brand: 'Geely', model: 'Atlas Pro', year: 2023, price: 1950000, mileage: 8000, fuel: 'Бензин', image: null, isNew: false },
  { id: 5, brand: 'Li Auto', model: 'L7', year: 2024, price: 4500000, mileage: 0, fuel: 'Гибрид', image: null, isNew: true },
  { id: 6, brand: 'Hongqi', model: 'H5', year: 2023, price: 2800000, mileage: 5000, fuel: 'Бензин', image: null, isNew: false },
]
