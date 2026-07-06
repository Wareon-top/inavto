import { useEffect } from 'react'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Story from './components/Story'
import Stats from './components/Stats'

export default function App() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let rafId: number
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="min-h-screen bg-black tracking-[-0.02em]" style={{ fontFamily: 'Inter' }}>
      <Navbar />
      <Hero />
      <div className="relative z-20 bg-black">
        <Story />
        <Stats />
        {/* Quote, CTA, Footer come in later prompts */}
      </div>
    </div>
  )
}
