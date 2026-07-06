import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  {
    path: '/',
    label: 'Главная',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? '#C8102E' : 'none'} stroke={active ? '#C8102E' : '#888'} strokeWidth="2" className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" />
      </svg>
    )
  },
  {
    path: '/catalog',
    label: 'Каталог',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#C8102E' : '#888'} strokeWidth="2" className="w-6 h-6">
        <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? '#C8102E22' : 'none'} />
        <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? '#C8102E22' : 'none'} />
        <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? '#C8102E22' : 'none'} />
        <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? '#C8102E22' : 'none'} />
      </svg>
    )
  },
  {
    path: '/selection',
    label: 'Подбор',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#C8102E' : '#888'} strokeWidth="2" className="w-6 h-6">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    )
  },
  {
    path: '/calculator',
    label: 'Расчёт',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#C8102E' : '#888'} strokeWidth="2" className="w-6 h-6">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h8M8 14h4" strokeLinecap="round" />
      </svg>
    )
  },
  {
    path: '/orders',
    label: 'Заказы',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#C8102E' : '#888'} strokeWidth="2" className="w-6 h-6">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
      <div className="bg-[#12122a] border-t border-white/10 flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-medium ${active ? 'text-[#C8102E]' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
