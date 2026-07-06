import PillButton from './PillButton'

const HERO =
  'https://images.unsplash.com/photo-1502085671122-2d218cd434e6?auto=format&fit=crop&w=1920&q=80'

export default function Hero() {
  return (
    <section className="sticky top-0 z-0 h-screen overflow-hidden">
      <img
        src={HERO}
        className="absolute inset-0 w-full h-full object-cover"
        alt="Desert canyon walls glowing at dusk"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75" />

      <div className="relative max-w-7xl mx-auto px-5 h-full flex flex-col justify-end pb-24 md:pb-32">
        <p className="hero-anim hero-fade text-xs tracking-[0.25em] text-white/50 uppercase mb-6">
          A field school of geology
        </p>
        <h1
          className="hero-anim hero-fade text-white text-5xl sm:text-7xl md:text-8xl leading-[1.0] max-w-4xl"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="block font-medium" style={{ letterSpacing: '-0.04em' }}>
            The earth keeps
          </span>
          <span
            className="block font-playfair italic font-normal bg-gradient-to-r from-[#f0b894] to-[#e8702a] bg-clip-text text-transparent"
            style={{ letterSpacing: '-0.03em' }}
          >
            its own journal
          </span>
        </h1>
        <p
          className="hero-anim hero-fade mt-6 max-w-xl text-lg text-white/70 leading-relaxed"
          style={{ animationDelay: '0.2s' }}
        >
          Stones teaches you to read it — canyon by canyon, layer by layer, out in the field
          where the pages are still turning.
        </p>
        <div className="hero-anim hero-fade mt-10" style={{ animationDelay: '0.3s' }}>
          <PillButton label="Begin the descent" />
        </div>
      </div>
    </section>
  )
}
