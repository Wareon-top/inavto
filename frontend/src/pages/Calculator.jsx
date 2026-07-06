import React, { useState, useMemo } from 'react'

const ENGINE_TYPES = [
  { label: 'Бензин / Дизель', value: 'fuel' },
  { label: 'Электро', value: 'electric' },
  { label: 'Гибрид', value: 'hybrid' },
]

function calcCustoms(price, volume, year, engineType) {
  const now = new Date().getFullYear()
  const age = now - year

  if (engineType === 'electric') {
    const util = 556200
    const customs = price * 0.15
    return { customs, util, delivery: 150000, commission: Math.round(price * 0.08) }
  }

  let rate = 0
  let perCC = 0

  if (age <= 3) {
    if (price <= 8500) { rate = 0.54; perCC = 2.5 }
    else if (price <= 16700) { rate = 0.48; perCC = 3.5 }
    else if (price <= 42300) { rate = 0.48; perCC = 5.5 }
    else if (price <= 84500) { rate = 0.48; perCC = 7.5 }
    else { rate = 0.48; perCC = 15 }
  } else if (age <= 5) {
    if (volume <= 1000) perCC = 1.5
    else if (volume <= 1500) perCC = 1.7
    else if (volume <= 1800) perCC = 2.5
    else if (volume <= 2300) perCC = 2.7
    else if (volume <= 3000) perCC = 3.0
    else perCC = 3.6
  } else {
    if (volume <= 1000) perCC = 3.0
    else if (volume <= 1500) perCC = 3.2
    else if (volume <= 1800) perCC = 3.5
    else if (volume <= 2300) perCC = 4.8
    else if (volume <= 3000) perCC = 5.0
    else perCC = 5.7
  }

  const priceRub = price * 92
  const customs = age <= 3
    ? Math.max(priceRub * rate, perCC * volume)
    : perCC * volume

  let util = 0
  if (volume <= 1000) util = 3400 * 106
  else if (volume <= 2000) util = 3400 * 134
  else if (volume <= 3000) util = 3400 * 202
  else util = 3400 * 404

  return {
    customs: Math.round(customs),
    util: Math.round(util),
    delivery: 150000,
    commission: Math.round(priceRub * 0.08)
  }
}

export default function Calculator() {
  const [priceEUR, setPriceEUR] = useState(15000)
  const [volume, setVolume] = useState(1600)
  const [year, setYear] = useState(2023)
  const [engineType, setEngineType] = useState('fuel')

  const result = useMemo(() => {
    const { customs, util, delivery, commission } = calcCustoms(priceEUR, volume, year, engineType)
    const carRub = priceEUR * 92
    const total = carRub + customs + util + delivery + commission
    return { carRub, customs, util, delivery, commission, total }
  }, [priceEUR, volume, year, engineType])

  const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'

  return (
    <div className="fade-in px-4 py-6">
      <h1 className="text-white font-black text-2xl mb-1">Калькулятор</h1>
      <p className="text-gray-400 text-sm mb-6">Расчёт стоимости под ключ</p>

      {/* Engine type */}
      <div className="flex gap-2 mb-5">
        {ENGINE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setEngineType(t.value)}
            className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-all ${
              engineType === t.value
                ? 'bg-[#C8102E] border-[#C8102E] text-white'
                : 'bg-[#1a1a2e] border-white/10 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="space-y-4 mb-6">
        <SliderField
          label="Стоимость авто в Китае"
          value={priceEUR}
          onChange={setPriceEUR}
          min={3000}
          max={100000}
          step={500}
          format={(v) => `${new Intl.NumberFormat('ru-RU').format(v)} €`}
          subtext={`≈ ${fmt(priceEUR * 92)}`}
        />
        {engineType !== 'electric' && (
          <SliderField
            label="Объём двигателя"
            value={volume}
            onChange={setVolume}
            min={500}
            max={4000}
            step={100}
            format={(v) => `${v} см³`}
          />
        )}
        <SliderField
          label="Год выпуска"
          value={year}
          onChange={setYear}
          min={2018}
          max={2025}
          step={1}
          format={(v) => `${v}`}
        />
      </div>

      {/* Result */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-3">Расчёт стоимости</h3>
        <div className="space-y-2.5">
          <ResultRow label="Стоимость авто (Китай)" value={fmt(result.carRub)} />
          <ResultRow label="Таможенная пошлина" value={fmt(result.customs)} />
          <ResultRow label="Утилизационный сбор" value={fmt(result.util)} />
          <ResultRow label="Доставка до России" value={fmt(result.delivery)} />
          <ResultRow label="Комиссия INAVTO" value={fmt(result.commission)} note="8%" />
        </div>
        <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
          <span className="text-white font-bold">ИТОГО под ключ</span>
          <span className="text-[#C8102E] font-black text-xl">{fmt(result.total)}</span>
        </div>
      </div>

      <p className="text-gray-600 text-xs mb-5 leading-relaxed">
        * Расчёт приблизительный. Точная стоимость зависит от комплектации, веса, маршрута доставки и курса валюты на дату оформления.
      </p>

      <button
        onClick={() => window.open('https://t.me/inavtochina', '_blank')}
        className="w-full bg-[#C8102E] text-white font-bold py-4 rounded-xl text-sm"
      >
        Получить точный расчёт
      </button>
    </div>
  )
}

function SliderField({ label, value, onChange, min, max, step, format, subtext }) {
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
      <div className="flex justify-between mb-2">
        <span className="text-gray-400 text-xs">{label}</span>
        <div className="text-right">
          <span className="text-white font-semibold text-sm">{format(value)}</span>
          {subtext && <p className="text-gray-500 text-[10px]">{subtext}</p>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#C8102E]"
      />
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

function ResultRow({ label, value, note }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}{note && <span className="text-gray-600 text-xs ml-1">({note})</span>}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
