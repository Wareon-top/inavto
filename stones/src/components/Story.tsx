import { useEffect, useRef } from 'react'
import useReveal from '../hooks/useReveal'
import PillButton from './PillButton'

const CANYON =
  'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1600&q=80'
const RIDGES =
  'https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=900&q=80'

/**
 * Subtle scroll parallax: shifts the element by its distance from the
 * viewport centre times `factor`, throttled to one update per frame.
 */
function useParallax(factor: number) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return

    let rafId = 0
    const update = () => {
      rafId = 0
      const rect = el.getBoundingClientRect()
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * factor
      el.style.transform = `translateY(${offset}px)`
    }
    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [factor])

  return ref
}

export default function Story() {
  const header = useReveal<HTMLDivElement>()
  const body = useReveal<HTMLDivElement>()
  const media = useReveal<HTMLDivElement>(0.2)
  const bigImg = useParallax(-0.05)
  const smallImg = useParallax(0.04)

  return (
    <section className="py-28 md:py-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5">
        <div ref={header.ref} className={`hero-anim ${header.inView ? 'hero-fade' : ''} max-w-3xl`}>
          <p className="text-xs tracking-[0.25em] text-white/40 uppercase mb-6">The Archive</p>
          <h2 className="text-white text-4xl sm:text-5xl md:text-7xl leading-[1.02]">
            <span className="block font-medium" style={{ letterSpacing: '-0.04em' }}>
              Every canyon is
            </span>
            <span
              className="block font-playfair italic font-normal bg-gradient-to-r from-[#f0b894] to-[#e8702a] bg-clip-text text-transparent"
              style={{ letterSpacing: '-0.03em' }}
            >
              an open book
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-5 mt-16 md:mt-24 items-start">
          <div ref={media.ref} className="col-span-12 md:col-span-7">
            <div ref={bigImg} className="will-change-transform">
              <div
                className={`img-anim ${media.inView ? 'img-reveal' : ''} relative rounded-3xl overflow-hidden border border-white/10`}
              >
                <img
                  src={CANYON}
                  className="w-full h-[420px] md:h-[560px] object-cover"
                  loading="lazy"
                  alt="Red sandstone towers of Wadi Rum under a hazy sky"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30" />
                <p className="absolute bottom-6 left-6 text-xs text-white/60 tracking-wide">
                  Wadi Rum sandstone — carved grain by grain, fifty million years deep
                </p>
              </div>
            </div>
          </div>

          <div
            ref={body.ref}
            className={`hero-anim ${body.inView ? 'hero-fade' : ''} col-span-12 md:col-span-5 md:pl-8 lg:pl-14 md:pt-10`}
            style={{ animationDelay: '0.15s' }}
          >
            <p className="text-lg md:text-xl text-white/70 leading-relaxed">
              Wind wrote the first chapter. Water edited it for a hundred million years. Stones
              teaches you the grammar — bedding planes, crossbeds, the rust-red ink of iron oxide —
              until a wall of rock reads like a page.
            </p>
            <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed">
              Walk a slot canyon with our field guides and you stop seeing stone. You start seeing
              weather, four stories tall.
            </p>
            <div className="mt-10">
              <PillButton label="Open the archive" />
            </div>

            <div
              ref={smallImg}
              className="will-change-transform mt-12 md:mt-16 md:-ml-24 lg:-ml-32 relative z-10 max-w-[320px]"
            >
              <div
                className={`img-anim ${media.inView ? 'img-reveal' : ''} relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]`}
                style={{ animationDelay: '0.25s' }}
              >
                <img
                  src={RIDGES}
                  className="w-full h-[220px] object-cover"
                  loading="lazy"
                  alt="Layered mountain ridgelines fading into haze"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                <p className="absolute bottom-4 left-4 text-[11px] text-white/60">
                  Chapter II — ridgelines stacked like pages
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
