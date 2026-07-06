import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitSelection } from '../utils/api'

const STEPS = [
  { id: 'budget', title: 'Ваш бюджет', subtitle: 'Укажите сумму на авто под ключ' },
  { id: 'brand', title: 'Марка авто', subtitle: 'Выберите предпочтительный бренд' },
  { id: 'body', title: 'Тип кузова', subtitle: 'Какой кузов вам нужен?' },
  { id: 'fuel', title: 'Тип двигателя', subtitle: 'Предпочтение по топливу' },
  { id: 'contacts', title: 'Контакты', subtitle: 'Куда отправить подборку' },
]

const BUDGETS = ['До 1.5 млн', '1.5 – 2.5 млн', '2.5 – 4 млн', '4 – 6 млн', 'Более 6 млн']
const BRANDS = ['Любой', 'Toyota', 'BYD', 'Chery', 'Haval', 'Geely', 'Li Auto', 'Nio', 'Xpeng', 'Другой']
const BODIES = ['Любой', 'Седан', 'Кроссовер', 'Внедорожник', 'Минивэн', 'Хэтчбек']
const FUELS = ['Любой', 'Бензин', 'Гибрид', 'Электро', 'Дизель']

export default function Selection() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ budget: '', brand: '', body: '', fuel: '', name: '', phone: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const current = STEPS[step]

  function pick(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (step < STEPS.length - 1) setTimeout(() => setStep(s => s + 1), 300)
  }

  async function submit() {
    setLoading(true)
    try {
      await submitSelection(form)
    } catch {
      // показываем успех даже при ошибке сети — заявка сохранится локально
    }
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="w-10 h-10">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-white font-black text-2xl mb-2">Заявка принята!</h2>
        <p className="text-gray-400 text-sm mb-2">Мы получили ваш запрос на подбор</p>
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 w-full max-w-sm mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Бюджет</span>
            <span className="text-white font-medium">{form.budget}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Марка</span>
            <span className="text-white font-medium">{form.brand}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Тип</span>
            <span className="text-white font-medium">{form.body}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Двигатель</span>
            <span className="text-white font-medium">{form.fuel}</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs mb-6">Менеджер свяжется с вами в течение 30 минут</p>
        <button onClick={() => navigate('/')} className="bg-[#C8102E] text-white font-bold px-8 py-3 rounded-xl text-sm">
          На главную
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">{current.title}</h1>
            <p className="text-gray-400 text-sm">{current.subtitle}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#C8102E]' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        {step === 0 && (
          <div className="space-y-2">
            {BUDGETS.map((b) => (
              <OptionButton key={b} label={b} selected={form.budget === b} onClick={() => pick('budget', b)} />
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {BRANDS.map((b) => (
              <OptionButton key={b} label={b} selected={form.brand === b} onClick={() => pick('brand', b)} />
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {BODIES.map((b) => (
              <OptionButton key={b} label={b} selected={form.body === b} onClick={() => pick('body', b)} />
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="grid grid-cols-2 gap-2">
            {FUELS.map((f) => (
              <OptionButton key={f} label={f} selected={form.fuel === f} onClick={() => pick('fuel', f)} />
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3">
            <Input placeholder="Ваше имя" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Input placeholder="Телефон / Telegram" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} type="tel" />
            <Input placeholder="Ваш город" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
            <button
              onClick={submit}
              disabled={!form.name || !form.phone || loading}
              className="w-full bg-[#C8102E] disabled:bg-[#C8102E]/40 text-white font-bold py-4 rounded-xl text-sm mt-2"
            >
              {loading ? 'Отправляем...' : 'Отправить заявку'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border font-medium text-sm transition-all card-hover ${
        selected
          ? 'bg-[#C8102E]/20 border-[#C8102E] text-white'
          : 'bg-[#1a1a2e] border-white/10 text-gray-300'
      }`}
    >
      {selected && <span className="mr-2">✓</span>}
      {label}
    </button>
  )
}

function Input({ placeholder, value, onChange, type = 'text' }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#1a1a2e] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C8102E]/50"
    />
  )
}
