import React from 'react'

const FUEL_COLORS = {
  'Электро': 'text-green-400 bg-green-400/10',
  'Гибрид': 'text-blue-400 bg-blue-400/10',
  'Бензин': 'text-orange-400 bg-orange-400/10',
  'Дизель': 'text-yellow-400 bg-yellow-400/10',
}

export default function CarCard({ car, onClick }) {
  const fuelStyle = FUEL_COLORS[car.fuel] || 'text-gray-400 bg-gray-400/10'

  return (
    <button
      onClick={onClick}
      className="card-hover bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden text-left w-full"
    >
      {/* Image */}
      <div className="relative bg-[#12122a] h-32 flex items-center justify-center">
        {car.image ? (
          <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-5xl opacity-30">🚗</div>
        )}
        {car.isNew && (
          <div className="absolute top-2 left-2 bg-[#C8102E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            NEW
          </div>
        )}
        <div className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${fuelStyle}`}>
          {car.fuel}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-gray-400 text-[11px]">{car.brand}</p>
        <p className="text-white font-semibold text-sm leading-tight">{car.model}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-500 text-[11px]">{car.year}</span>
          {car.mileage > 0 && (
            <span className="text-gray-500 text-[11px]">{(car.mileage / 1000).toFixed(0)}к км</span>
          )}
        </div>
        <p className="text-[#C8102E] font-bold text-sm mt-1.5">
          {(car.price / 1000000).toFixed(2)} млн ₽
        </p>
      </div>
    </button>
  )
}
