import { useMemo } from 'react'

export default function AssetChartCard({ asset, timeframe = '1w', onSelect }) {
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const currentPrice = asset.last_price || 30.00

  // Deterministic generator of points based on symbol and timeframe
  const chartData = useMemo(() => {
    // Generate pseudorandom seed based on asset symbol
    let hash = 0
    for (let i = 0; i < asset.symbol.length; i++) {
      hash = (hash << 5) - hash + asset.symbol.charCodeAt(i)
      hash |= 0
    }
    const seed = Math.abs(hash) % 100

    let numPoints = 8
    let maxVariance = 0.03
    if (timeframe === '1d') {
      numPoints = 7
      maxVariance = 0.015
    } else if (timeframe === '1w') {
      numPoints = 8
      maxVariance = 0.04
    } else if (timeframe === '1m') {
      numPoints = 10
      maxVariance = 0.08
    }

    const points = []
    // Pre-calculate synthetic trajectory ending exactly at currentPrice
    const baseVariance = (seed / 100) * maxVariance * (seed % 2 === 0 ? 1 : -1)
    const startPrice = currentPrice * (1 - baseVariance)

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1)
      const noise = Math.sin((i + seed) * 1.5) * (maxVariance * 0.4) * currentPrice
      const val = startPrice + (currentPrice - startPrice) * progress + (i === numPoints - 1 ? 0 : noise)
      points.push(Math.max(1, val))
    }

    const firstVal = points[0]
    const lastVal = points[points.length - 1]
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
  const width = 280
  const height = 110
  const paddingLeft = 24
  const paddingRight = 60 // space for price tag
  const paddingTop = 15
  const paddingBottom = 20

  const minVal = Math.min(...chartData.points) * 0.99
  const maxVal = Math.max(...chartData.points) * 1.01
  const range = maxVal - minVal || 1

  const svgCoordinates = chartData.points.map((val, idx) => {
    const x = paddingLeft + (idx / (chartData.points.length - 1)) * (width - paddingLeft - paddingRight)
    const y = height - paddingBottom - ((val - minVal) / range) * (height - paddingTop - paddingBottom)
    return { x, y, val }
  })

  const polylinePoints = svgCoordinates.map(p => `${p.x},${p.y}`).join(' ')
  const lastPoint = svgCoordinates[svgCoordinates.length - 1]

  const timeframeLabels = {
    '1d': 'Variação 1D',
    '1w': 'Variação 1S',
    '1m': 'Variação 1M',
  }

  return (
    <div 
      onClick={() => onSelect && onSelect(asset.symbol)}
      className="surface-card p-4 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
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

      {/* SVG Sparkline Graph */}
      <div className="w-full bg-[#0c0c0e] border border-zinc-850 rounded p-2 overflow-hidden relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-24 overflow-visible"
        >
          {/* Axis lines */}
          <line
            x1={paddingLeft - 4}
            y1={paddingTop - 4}
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

          {/* Intermediate Nodes */}
          {svgCoordinates.slice(0, -1).map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#18181b"
              stroke="#a1a1aa"
              strokeWidth="1.75"
            />
          ))}

          {/* End Node (Active / Colored) */}
          {lastPoint && (
            <>
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="4.5"
                fill={chartData.isPositive ? '#10b981' : '#f43f5e'}
                stroke="#0c0c0e"
                strokeWidth="1.5"
              />
              {/* End Price Tag Text */}
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
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
