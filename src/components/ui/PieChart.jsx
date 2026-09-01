import { useState } from 'react'

export default function PieChart({ data = [], totalValue = 0 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const size = 220
  const center = size / 2
  const radius = 70
  const strokeWidth = 24
  const circumference = 2 * Math.PI * radius

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  // Filter out items with 0 percent
  const validItems = data.filter(d => d.percent > 0)
  
  // Pure functional calculation of stroke-dasharray and stroke-dashoffset
  const slices = validItems.map((item, idx) => {
    const priorPercent = validItems.slice(0, idx).reduce((acc, curr) => acc + curr.percent, 0)
    const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`
    const strokeDashoffset = -((priorPercent / 100) * circumference)

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      originalIndex: idx,
    }
  })

  const activeItem = hoveredIndex !== null ? validItems[hoveredIndex] : null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
      
      {/* SVG Donut / Pie */}
      <div className="relative w-[220px] h-[220px] shrink-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#18181b"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice, idx) => {
            const isHovered = hoveredIndex === idx
            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            )
          })}
        </svg>

        {/* Center Details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeItem ? (
            <>
              <span className="text-[10px] text-zinc-400 font-medium uppercase truncate max-w-[120px]">
                {activeItem.label.split('(')[0]}
              </span>
              <span className="font-mono-nums text-lg font-bold text-zinc-100">
                {activeItem.percent.toFixed(1)}%
              </span>
              <span className="font-mono-nums text-[10px] text-zinc-400">
                {formatBRL(activeItem.value)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                Patrimônio
              </span>
              <span className="font-mono-nums text-xs font-semibold text-zinc-200">
                {totalValue ? formatBRL(totalValue) : '100%'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Values list */}
      <div className="space-y-2.5 w-full max-w-xs">
        {validItems.map((item, idx) => {
          const isHovered = hoveredIndex === idx
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2.5 rounded border transition-all cursor-pointer ${
                isHovered
                  ? 'bg-zinc-850 border-zinc-700 shadow-sm'
                  : 'bg-[#0c0c0e] border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[140px]">
                  {item.label.split('(')[0]}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono-nums text-xs font-semibold text-zinc-100 block">
                  {item.percent.toFixed(1)}%
                </span>
                <span className="font-mono-nums text-[10px] text-zinc-500 block">
                  {formatBRL(item.value)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
