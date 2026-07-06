import React from 'react'
import { useNavigate } from 'react-router-dom'

const advantages = [
  { icon: '🏢', title: 'Представительство в Китае', desc: 'Собственный офис в Шанхае' },
  { icon: '🏦', title: 'Оплата по инвойсу ВТБ', desc: 'Безопасные расчёты через банк' },
  { icon: '🔍', title: 'Проверка автомобилей', desc: 'Осмотр перед выкупом' },
  { icon: '🚢', title: 'Доставка под ключ', desc: 'От аукциона до вашего города' },
]

const popularBrands = [
  { name: 'Toyota', logo: '🚗' },
  { name: 'BYD', logo: '⚡' },
  { name: 'Chery', logo: '🚙' },
  { name: 'Haval', logo: '🛻' },
  { name: 'Geely', logo: '🚘' },
  { name: 'Li Auto', logo: '🔋' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1A1A2E] to-[#0f0f1a] px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#C8102E] rounded-lg flex items-center justify-center text-white font-black text-sm">IN</div>
              <span className="text-white font-bold text-xl tracking-wide">INAVTO</span>
              <span className="text-[#C8102E] font-bold text-xl">China</span>
            </div>
            <p className="text-gray-400 text-xs">Автомобили из Китая под ключ</p>
          </div>
          <button
            onClick={() => window.open('https://t.me/inavtochina', '_blank')}
            className="bg-[#C8102E]/20 border border-[#C8102E]/40 text-[#C8102E] text-xs font-medium px-3 py-1.5 rounded-full"
          >
            Связаться
          </button>
        </div>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-[#C8102E] to-[#8B0000] rounded-2xl p-5 overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full opacity-10">
            <div className="text-[120px] leading-none select-none">🚗</div>
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-medium mb-1">Прямые поставки</p>
            <h1 className="text-white font-black text-2xl leading-tight mb-2">
              Авто из Китая<br />без переплат
            </h1>
            <p className="text-white/70 text-sm mb-4">
              Более 500 000 автомобилей<br />на китайских площадках
            </p>
            <button
              onClick={() => navigate('/catalog')}
              className="bg-white text-[#C8102E] font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg"
            >
              Смотреть каталог →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/selection')}
            className="card-hover bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-left"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-white font-semibold text-sm">Подобрать авто</div>
            <div className="text-gray-500 text-xs mt-0.5">По вашему бюджету</div>
          </button>
          <button
            onClick={() => navigate('/calculator')}
            className="card-hover bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-left"
          >
            <div className="text-2xl mb-2">🧮</div>
            <div className="text-white font-semibold text-sm">Рассчитать стоимость</div>
            <div className="text-gray-500 text-xs mt-0.5">Таможня + доставка</div>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="card-hover bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-left"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="text-white font-semibold text-sm">Мои заказы</div>
            <div className="text-gray-500 text-xs mt-0.5">Отследить статус</div>
          </button>
          <button
            onClick={() => window.open('https://t.me/inavtochina', '_blank')}
            className="card-hover bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-2xl p-4 text-left"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="text-[#C8102E] font-semibold text-sm">Консультация</div>
            <div className="text-gray-500 text-xs mt-0.5">Бесплатно</div>
          </button>
        </div>
      </div>

      {/* Popular Brands */}
      <div className="px-4 mb-6">
        <h2 className="text-white font-bold text-base mb-3">Популярные марки</h2>
        <div className="grid grid-cols-3 gap-2">
          {popularBrands.map((brand) => (
            <button
              key={brand.name}
              onClick={() => navigate(`/catalog?brand=${brand.name}`)}
              className="card-hover bg-[#1a1a2e] border border-white/10 rounded-xl py-3 flex flex-col items-center gap-1"
            >
              <span className="text-xl">{brand.logo}</span>
              <span className="text-white text-xs font-medium">{brand.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advantages */}
      <div className="px-4 mb-6">
        <h2 className="text-white font-bold text-base mb-3">Почему INAVTO China</h2>
        <div className="space-y-2">
          {advantages.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#1a1a2e] border border-white/10 rounded-xl p-3">
              <div className="w-10 h-10 bg-[#C8102E]/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{item.title}</div>
                <div className="text-gray-500 text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f0f1a] border border-[#C8102E]/30 rounded-2xl p-5 text-center">
          <p className="text-white font-bold text-lg mb-1">Нужна помощь с выбором?</p>
          <p className="text-gray-400 text-sm mb-4">Наш менеджер подберёт авто под ваш бюджет и пожелания бесплатно</p>
          <button
            onClick={() => navigate('/selection')}
            className="w-full bg-[#C8102E] text-white font-bold py-3 rounded-xl text-sm"
          >
            Оставить заявку на подбор
          </button>
        </div>
      </div>
    </div>
  )
}
