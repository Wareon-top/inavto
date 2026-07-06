import { ChevronsRight } from 'lucide-react'

export default function PillButton({ label }: { label: string }) {
  return (
    <button className="group rounded-full bg-white/[0.06] border border-white/10 backdrop-blur px-1.5 py-1.5 pr-5 flex items-center gap-3 hover:bg-white/[0.1] hover:border-white/20 transition-colors duration-300">
      <span className="bg-[#e8702a] rounded-full p-2 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
        <ChevronsRight size={14} className="text-white" />
      </span>
      <span className="text-sm text-white">{label}</span>
    </button>
  )
}
