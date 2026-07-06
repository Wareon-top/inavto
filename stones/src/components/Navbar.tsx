export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-white">
          <span className="w-2 h-2 rounded-full bg-[#e8702a]" />
          <span className="text-sm font-semibold tracking-[0.18em] uppercase">Stones</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#" className="hover:text-white transition-colors duration-300">Archive</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Routes</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Guides</a>
        </div>
        <a
          href="#"
          className="rounded-full border border-white/15 bg-white/[0.06] backdrop-blur px-4 py-2 text-sm text-white hover:bg-white/[0.1] hover:border-white/25 transition-colors duration-300"
        >
          Start reading
        </a>
      </nav>
    </header>
  )
}
