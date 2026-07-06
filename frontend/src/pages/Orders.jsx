import React, { useState } from 'react'

const STATUS_STEPS = [
  { key: 'search', icon: '🔍', label: 'Поиск авто', desc: 'Ищем подходящие варианты' },
  { key: 'found', icon: '✅', label: 'Авто найден', desc: 'Согласование с клиентом' },
  { key: 'bought', icon: '💰', label: 'Выкуплен', desc: 'Оплата и оформление' },
  { key: 'shipping', icon: '🚢', label: 'Отправлен', desc: 'В пути из Китая' },
  { key: 'customs', icon: '🛃', label: 'Таможня', desc: 'Оформление в России' },
  { key: 'delivery', icon: '🚚', label: 'Доставка', desc: 'Везём к вам' },
  { key: 'done', icon: '🎉', label: 'Готово!', desc: 'Авто у вас' },
]

const MOCK_ORDERS = [
  {
    id: 'INV-2024-001',
    car: 'BYD Han EV 2024',
    status: 'shipping',
    price: 3200000,
    date: '12.11.2024',
    eta: '25.12.2024',
    note: 'Контейнер COSCO SHIPPING · Шанхай → Владивосток'
  },
  {
    id: 'INV-2024-002',
    car: 'Chery Tiggo 8 Pro 2023',
    status: 'customs',
    price: 2100000,
    date: '01.11.2024',
    eta: '15.12.2024',
    note: 'Таможенный пост Приморский · Ожидание документов'
  }
]

export default function Orders() {
  const [activeOrder, setActiveOrder] = useState(null)
  const [inputId, setInputId] = useState('')
  const [searched, setSearched] = useState(false)

  function search() {
    if (!inputId.trim()) return
    const found = MOCK_ORDERS.find(o => o.id.toLowerCase() === inputId.trim().toLowerCase())
    setActiveOrder(found || null)
    setSearched(true)
  }

  return (
    <div className="fade-in px-4 py-6">
      <h1 className="text-white font-black text-2xl mb-1">Мои заказы</h1>
      <p className="text-gray-400 text-sm mb-6">Отслеживайте статус вашего авто</p>

      {/* Search by ID */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Номер заказа (INV-2024-001)"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="flex-1 bg-[#1a1a2e] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8102E]/50"
        />
        <button
          onClick={search}
          className="bg-[#C8102E] text-white px-4 py-3 rounded-xl font-bold text-sm"
        >
          Найти
        </button>
      </div>

      {searched && !activeOrder && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 text-center mb-6">
          <div className="text-3xl mb-2">🔎</div>
          <p className="text-white font-semibold">Заказ не найден</p>
          <p className="text-gray-500 text-xs mt-1">Проверьте номер или обратитесь к менеджеру</p>
        </div>
      )}

      {activeOrder && <OrderCard order={activeOrder} />}

      {/* Demo orders */}
      <div className="mt-6">
        <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Пример заказов</p>
        <div className="space-y-3">
          {MOCK_ORDERS.map(order => (
            <button
              key={order.id}
              onClick={() => { setActiveOrder(order); setInputId(order.id) }}
              className="card-hover w-full bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-left"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#C8102E] font-mono text-xs">{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-white font-semibold text-sm">{order.car}</p>
              <p className="text-gray-500 text-xs mt-1">Ожидаемая дата: {order.eta}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === order.status)

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[#C8102E] font-mono text-xs">{order.id}</p>
          <p className="text-white font-bold text-base">{order.car}</p>
          <p className="text-gray-500 text-xs">Заказан: {order.date}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">{(order.price / 1000000).toFixed(2)} млн ₽</p>
          <p className="text-gray-500 text-xs">ETA: {order.eta}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0 mt-4">
        {STATUS_STEPS.map((step, i) => {
          const isCompleted = i < currentIdx
          const isCurrent = i === currentIdx
          const isUpcoming = i > currentIdx

          return (
            <div key={step.key} className="flex gap-3">
              {/* Line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm border-2 ${
                  isCompleted ? 'bg-[#C8102E] border-[#C8102E]' :
                  isCurrent ? 'bg-[#C8102E]/20 border-[#C8102E] animate-pulse' :
                  'bg-transparent border-white/10'
                }`}>
                  {isCompleted ? '✓' : step.icon}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 ${i < currentIdx ? 'bg-[#C8102E]' : 'bg-white/10'}`} />
                )}
              </div>

              {/* Text */}
              <div className="pb-4 pt-1">
                <p className={`text-sm font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-white/70' : 'text-gray-600'}`}>
                  {step.label}
                  {isCurrent && <span className="ml-2 text-[#C8102E] text-xs">● сейчас</span>}
                </p>
                {isCurrent && <p className="text-gray-400 text-xs mt-0.5">{order.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    search: { label: 'Поиск', color: 'text-yellow-400 bg-yellow-400/10' },
    found: { label: 'Найден', color: 'text-blue-400 bg-blue-400/10' },
    bought: { label: 'Выкуплен', color: 'text-purple-400 bg-purple-400/10' },
    shipping: { label: 'В пути', color: 'text-cyan-400 bg-cyan-400/10' },
    customs: { label: 'Таможня', color: 'text-orange-400 bg-orange-400/10' },
    delivery: { label: 'Доставка', color: 'text-green-400 bg-green-400/10' },
    done: { label: 'Готово', color: 'text-green-400 bg-green-400/10' },
  }
  const s = map[status] || map.search
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
}
