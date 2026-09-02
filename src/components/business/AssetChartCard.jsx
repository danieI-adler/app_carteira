import { useState, useMemo } from 'react'

export default function AssetChartCard({ asset, timeframe = '1w', onSelect }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const currentPrice = asset.last_price || 30.00

  // Deterministic generator of points with timestamps
  const chartData = useMemo(() => {
    let hash = 0
    for (let i = 0; i < asset.symbol.length; i++) {
      hash = (hash << 5) - hash + asset.symbol.charCodeAt(i)
      hash |= 0
    }
    const seed = Math.abs(hash) % 100

    let numPoints = 8
    let maxVariance = 0.04
    let timeLabels = []

    const now = new Date()

    if (timeframe === '1d') {
      numPoints = 7
      maxVariance = 0.018
      timeLabels = ['10:00', '11:15', '12:30', '13:45', '15:00', '16:30', '18:00']
    } else if (timeframe === '1w') {
      numPoints = 6
      maxVariance = 0.04
      // Past 5 business days
      timeLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Hoje']
    } else if (timeframe === '1m') {
      numPoints = 8
      maxVariance = 0.08
      timeLabels = []
      for (let i = numPoints - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - (i * 4))
        const dayStr = String(d.getDate()).padStart(2, '0')
        const monthStr = String(d.getMonth() + 1).padStart(2, '0')
        timeLabels.push(`${dayStr}/${monthStr}`)
      }
    }

    const points = []
    const baseVariance = (seed / 100) * maxVariance * (seed % 2 === 0 ? 1 : -1)
    const startPrice = currentPrice * (1 - baseVariance)

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1)
      const noise = Math.sin((i + seed) * 1.5) * (maxVariance * 0.4) * currentPrice
      const val = startPrice + (currentPrice - startPrice) * progress + (i === numPoints - 1 ? 0 : noise)
      points.push({
        price: Math.max(1, parseFloat(val.toFixed(2))),
        label: timeLabels[i] || `Ponto ${i + 1}`
      })
    }

    const firstVal = points[0].price
    const lastVal = points[points.length - 1].price
    const diff = lastVal - firstVal
    const changePercent = (diff / firstVal) * 100
    const isPositive = changePercent >= 0

    return {
      points,
      changePercent,
      isPositive,
    }
  }, [asset.symbol, currentPrice, timeframe])

  // Chart coordinates calculation
  const width = 300
  const height = 120
  const paddingLeft = 24
  const paddingRight = 65 // space for price tag
  const paddingTop = 22
  const paddingBottom = 22

  const priceValues = chartData.points.map(p => p.price)
  const minVal = Math.min(...priceValues) * 0.995
  const maxVal = Math.max(...priceValues) * 1.005
  const range = maxVal - minVal || 1

  const svgCoordinates = chartData.points.map((pt, idx) => {
    const x = paddingLeft + (idx / (chartData.points.length - 1)) * (width - paddingLeft - paddingRight)
    const y = height - paddingBottom - ((pt.price - minVal) / range) * (height - paddingTop - paddingBottom)
    return { x, y, price: pt.price, label: pt.label }
  })

  const polylinePoints = svgCoordinates.map(p => `${p.x},${p.y}`).join(' ')
  const lastPoint = svgCoordinates[svgCoordinates.length - 1]
  const activeHover = hoveredIndex !== null ? svgCoordinates[hoveredIndex] : null

  const timeframeLabels = {
    '1d': 'Variação 1D',
    '1w': 'Variação 1S',
    '1m': 'Variação 1M',
  }

  return (
    <div 
      onClick={() => onSelect && onSelect(asset.symbol)}
      className="surface-card p-4 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-zinc-200 tracking-tight">
            {asset.symbol} B3
          </h3>
          <span className="text-[11px] text-zinc-400 uppercase font-medium">
            {asset.type || 'Ação'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 font-medium block">
            {timeframeLabels[timeframe] || 'Variação'}
          </span>
          <span className={`text-xs font-mono-nums font-semibold flex items-center justify-end gap-0.5 ${
            chartData.isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            <span>{chartData.isPositive ? '▲' : '▼'}</span>
            <span>{Math.abs(chartData.changePercent).toFixed(2)}%</span>
          </span>
        </div>
      </div>

      {/* SVG Interactive Sparkline Graph */}
      <div className="w-full bg-[#0c0c0e] border border-zinc-850 rounded p-2 overflow-visible relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 overflow-visible select-none"
        >
          {/* Axis lines */}
          <line
            x1={paddingLeft - 4}
            y1={paddingTop - 6}
            x2={paddingLeft - 4}
            y2={height - paddingBottom + 4}
            stroke="#27272a"
            strokeWidth="1.5"
          />
          <line
            x1={paddingLeft - 4}
            y1={height - paddingBottom + 4}
            x2={width - 10}
            y2={height - paddingBottom + 4}
            stroke="#27272a"
            strokeWidth="1.5"
          />

          {/* Polyline line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#71717a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical guideline on hover */}
          {activeHover && (
            <line
              x1={activeHover.x}
              y1={paddingTop - 6}
              x2={activeHover.x}
              y2={height - paddingBottom + 4}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Interactive Nodes & Touch Targets */}
          {svgCoordinates.map((pt, idx) => {
            const isLast = idx === svgCoordinates.length - 1
            const isHovered = hoveredIndex === idx

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Transparent wider target for easy hovering */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                />

                {/* Visible node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : isLast ? 4.5 : 3.5}
                  fill={isHovered ? '#3b82f6' : isLast ? (chartData.isPositive ? '#10b981' : '#f43f5e') : '#18181b'}
                  stroke={isHovered ? '#93c5fd' : isLast ? '#0c0c0e' : '#a1a1aa'}
                  strokeWidth={isHovered ? 2 : 1.75}
                  className="transition-all duration-150"
                />
              </g>
            )
          })}

          {/* Default End Price Tag (when not hovered) */}
          {lastPoint && !activeHover && (
            <text
              x={lastPoint.x + 8}
              y={lastPoint.y + 3.5}
              fill={chartData.isPositive ? '#34d399' : '#fb7185'}
              fontSize="10"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontWeight="bold"
            >
              {formatBRL(currentPrice)}
            </text>
          )}

          {/* Hover Tooltip Overlay in SVG */}
          {activeHover && (
            <g transform={`translate(${Math.min(activeHover.x - 35, width - 85)}, ${Math.max(2, activeHover.y - 28)})`}>
              <rect
                x="0"
                y="0"
                width="72"
                height="22"
                rx="4"
                fill="#18181b"
                stroke="#3b82f6"
                strokeWidth="1"
                className="shadow-lg"
              />
              <text
                x="36"
                y="10"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontWeight="500"
              >
                {activeHover.label}
              </text>
              <text
                x="36"
                y="19"
                textAnchor="middle"
                fill="#f4f4f5"
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fontWeight="bold"
              >
                {formatBRL(activeHover.price)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
