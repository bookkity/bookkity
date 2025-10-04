import { useRef, useState } from 'react'

export default function Spoiler({ title, children }) {
  const detailsRef = useRef(null)
  const [open, setOpen] = useState(false)

  return (
    <details
      ref={detailsRef}
      className="mb-4 rounded-lg bg-white transition-all duration-200 group"
      onToggle={() => setOpen(detailsRef.current?.open)}
    >
      <summary className='
        flex items-center gap-2
        cursor-pointer select-none
        py-2 px-4
        font-semibold text-black rounded-lg
        hover:bg-gray-50 hover:border-gray-400
        transition-colors duration-150 outline-none focus:outline-none bg-white
      '>
        <span className="flex-1 text-sm">{title}</span>
        <span className="text-xs text-gray-500 mr-1">{open ? 'Hide' : 'Show'}</span>
        <svg
          className={`w-5 h-5 text-purple-500 transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </summary>
      <div className="px-4 py-3 text-gray-800 bg-white animate-fade-in">
        {children}
      </div>
    </details>
  )
}
