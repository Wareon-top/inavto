import { useEffect, useRef, useState } from 'react'
import useReveal from '../hooks/useReveal'

interface Stat {
  value: number
  decimals?: number
  suffix: string
  label: string
}

const STATS: Stat[] = [
  { value: 4.6, decimals: 1, suffix: 'B', label: 'years of record, indexed' },
  { value: 12400, suffix: '+', label: 'strata layers mapped' },
  { value: 380, suffix: '', label: 'field routes with live guides' },
  { value: 96, suffix: '%', label: 'of learners read rock unaided' },
]

function Counter({ stat, start }: { stat: Stat; start: boolean }) {
  const [val, setVal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!start || started.current) return
    started.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(stat.value)
      return
    }

    const duration = 1800
    const t0 = performance.now()
    let rafId: number
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(stat.value * eased)
      if (p < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [start, stat.value])

  const text = stat.decimals
    ? val.toFixed(stat.decimals)
    : Math.round(val).toLocaleString('en-US')

  return (
    <>
      {text}
      <span className="text-[#e8702a]">{stat.suffix}</span>
    </>
  )
}

export default function Stats() {
  const block = useReveal<HTMLDivElement>(0.3)

  return (
    <section className="py-6">
      <div ref={block.ref} className="max-w-7xl mx-auto px-5 border-y border-white/[0.07]">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`hero-anim ${block.inView ? 'hero-fade' : ''} py-12 md:py-16 px-2 sm:px-6 ${i > 0 ? 'lg:border-l lg:border-white/[0.07]' : ''} ${i % 2 === 1 ? 'border-l border-white/[0.07] lg:border-l' : ''}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div
                className="font-playfair italic text-5xl md:text-6xl text-white/90"
                style={{ letterSpacing: '-0.03em' }}
              >
                <Counter stat={stat} start={block.inView} />
              </div>
              <p className="text-sm text-white/45 mt-4 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
