import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCarById } from '../utils/api'

const MOCK_CAR = {
  id: 1, brand: 'BYD', model: 'Han EV', year: 2024, price: 3200000,
  mileage: 0, fuel: 'Электро', image: null, isNew: true,
  engine: 'Электро 517 л.с.', transmission: 'Авт.', drive: 'Полный',
  color: 'Чёрный', vin: 'LBVAA2E54PH012345', deliveryDays: '45-60',
  description: 'Флагманский электромобиль BYD Han EV с запасом хода 605 км. Полный привод, разгон до 100 км/ч за 3.9 сек. Комплектация: панорамная крыша, HUD, массаж сидений, система помощи водителю.',
  specs: [
    { label: 'Тип', value: 'Седан' },
    { label: 'Двигатель', value: 'Электро 517 л.с.' },
    { label: 'Запас хода', value: '605 км' },
    { label: 'КПП', value: 'Автомат' },
    { label: 'Привод', value: 'Полный' },
    { label: 'Цвет', value: 'Чёрный' },
    { label: 'Пробег', value: '0 км' },
    { label: 'Год', value: '2024' },
  ],
  priceBreakdown: {
    carPrice: 2100000,
    customs: 650000,
    delivery: 150000,
    commission: 300000,
    total: 3200000
  }
}

export default function CarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    loadCar()
  }, [id])

  async function loadCar() {
    try {
      const data = await getCarById(id)
      setCar(data)
    } catch {
      setCar(MOCK_CAR)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="shimmer rounded-2xl h-56" />
        <div className="shimmer rounded-xl h-6 w-2/3" />
        <div className="shimmer rounded-xl h-4 w-1/2" />
      </div>
    )
  }

  if (!car) return null

  return (
    <div className="fade-in pb-32">
      {/* Back */}
      <div className="sticky top-0 z-40 bg-[#0f0f1a]/90 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-white font-semibold">{car.brand} {car.model}</span>
      </div>

      {/* Image */}
      <div className="bg-[#12122a] h-52 flex items-center justify-center">
        {car.image ? (
          <img src={car.image} alt={car.model} className="w-full h-full object-cover" />
        ) : (
          <div className="text-8xl opacity-20">🚗</div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Title */}
        <div>
          {car.isNew && (
            <span className="bg-[#C8102E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-2">NEW</span>
          )}
          <h1 className="text-white font-black text-2xl mt-2">{car.brand} {car.model}</h1>
          <p className="text-gray-400 text-sm">{car.year} · {car.fuel}</p>
        </div>

        {/* Price */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-1">Стоимость под ключ</p>
          <p className="text-[#C8102E] font-black text-3xl">{(car.price / 1000000).toFixed(2)} млн ₽</p>
          <p className="text-gray-500 text-xs mt-1">Доставка {car.deliveryDays} дней</p>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-[#C8102E] text-xs font-medium mt-2 flex items-center gap-1"
          >
            Состав цены {showBreakdown ? '▲' : '▼'}
          </button>
          {showBreakdown && (
            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              {Object.entries(car.priceBreakdown).map(([key, val]) => {
                const labels = { carPrice: 'Стоимость авто (Китай)', customs: 'Таможня + утильсбор', delivery: 'Доставка', commission: 'Комиссия', total: 'ИТОГО' }
                return (
                  <div key={key} className={`flex justify-between text-sm ${key === 'total' ? 'font-bold text-white border-t border-white/10 pt-2 mt-2' : 'text-gray-400'}`}>
                    <span>{labels[key]}</span>
                    <span>{(val / 1000).toFixed(0)} тыс ₽</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Характеристики</h3>
          <div className="grid grid-cols-2 gap-y-2">
            {car.specs.map((s, i) => (
              <div key={i}>
                <p className="text-gray-500 text-[11px]">{s.label}</p>
                <p className="text-white text-sm font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* VIN */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-1">VIN номер</p>
          <p className="text-white font-mono text-sm tracking-wider">{car.vin}</p>
        </div>

        {/* Description */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-2">Описание</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{car.description}</p>
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur-sm border-t border-white/10 px-4 py-3 space-y-2">
        <button
          onClick={() => {
            setBooked(true)
            window.open('https://t.me/inavtochina', '_blank')
          }}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
            booked ? 'bg-green-600 text-white' : 'bg-[#C8102E] text-white'
          }`}
        >
          {booked ? '✓ Заявка отправлена' : 'Забронировать авто'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('https://t.me/inavtochina', '_blank')}
            className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            Связаться
          </button>
          <button
            onClick={() => window.open('https://t.me/inavtochina', '_blank')}
            className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            Получить расчёт
          </button>
        </div>
      </div>
    </div>
  )
}
