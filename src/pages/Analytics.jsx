import { useMemo } from 'react'
import usePortfolio from '../hooks/usePortfolio'

export default function Analytics() {
  const { team, positions, loading, error } = usePortfolio()

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const balance = team?.balance ?? 10000000.00
  const netWorth = team?.net_worth ?? 10000000.00
  const monthlySavingsYield = balance * 0.005

  const allocation = useMemo(() => {
    let acoesVal = 0
    let fiisVal = 0
    let etfsVal = 0

    positions.forEach((pos) => {
      const price = pos.assets?.last_price || pos.average_price
      const total = pos.quantity * price
      const type = (pos.assets?.type || 'acao').toLowerCase()

      if (type === 'acao') acoesVal += total
      else if (type === 'fii') fiisVal += total
      else if (type === 'etf') etfsVal += total
      else acoesVal += total
    })

    const totalPortfolio = netWorth || 1

    return {
      cash: {
        label: 'Caixa / Poupança Automática (0,5% a.m.)',
        value: balance,
        percent: Math.max(0, (balance / totalPortfolio) * 100),
        color: '#71717a', // zinc-500
      },
      acoes: {
        label: 'Ações B3',
        value: acoesVal,
        percent: Math.max(0, (acoesVal / totalPortfolio) * 100),
        color: '#10b981', // emerald
      },
      fiis: {
        label: 'Fundos Imobiliários (FIIs)',
        value: fiisVal,
        percent: Math.max(0, (fiisVal / totalPortfolio) * 100),
        color: '#3b82f6', // blue
      },
      etfs: {
        label: 'ETFs & Índices Globais',
        value: etfsVal,
        percent: Math.max(0, (etfsVal / totalPortfolio) * 100),
        color: '#f59e0b', // amber
      },
    }
  }, [positions, balance, netWorth])

  const evolutionPoints = useMemo(() => {
    const initial = 10000000
    const current = netWorth
    const diff = current - initial

    return [
      { label: 'Base', value: initial },
      { label: 'Sem 1', value: initial + diff * 0.15 },
      { label: 'Sem 2', value: initial + diff * 0.35 },
      { label: 'Sem 3', value: initial + diff * 0.60 },
      { label: 'Sem 4', value: initial + diff * 0.85 },
      { label: 'Atual', value: current },
    ]
  }, [netWorth])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-100 rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 font-medium">Calculando métricas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="surface-card p-6 max-w-md mx-auto text-center border-red-900/40 text-red-400 text-xs">{error}</div>
    )
  }

  const minVal = Math.min(...evolutionPoints.map(p => p.value)) * 0.99
  const maxVal = Math.max(...evolutionPoints.map(p => p.value)) * 1.01
  const range = maxVal - minVal || 1
  const chartWidth = 700
  const chartHeight = 200

  const svgPoints = evolutionPoints.map((pt, idx) => {
    const x = (idx / (evolutionPoints.length - 1)) * (chartWidth - 40) + 20
    const y = chartHeight - 25 - ((pt.value - minVal) / range) * (chartHeight - 50)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `20,${chartHeight - 25} ${svgPoints} ${chartWidth - 20},${chartHeight - 25}`

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Análise Quantitativa</div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-0.5">Alocação e Evolução Patrimonial</h1>
      </div>

      {/* Automatic Savings Note */}
      <div className="surface-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs font-semibold text-zinc-200">Regra de Poupança Automática (0,5% a.m.)</div>
          <p className="text-xs text-zinc-400 mt-0.5">
            O saldo não alocado em ativos permanece em poupança com liquidez imediata para compras.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6 shrink-0">
          <span className="text-[11px] text-zinc-500 block">Projeção Mensal de Juros</span>
          <span className="font-mono-nums font-semibold text-emerald-400 text-sm">+{formatBRL(monthlySavingsYield)}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Allocation */}
        <div className="surface-card p-5 space-y-5">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold text-zinc-100">Alocação por Classe de Ativos</h2>
            <span className="text-xs font-mono-nums text-zinc-500">{positions.length} ativos</span>
          </div>

          <div className="w-full h-3 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex">
            {Object.values(allocation).map((item, idx) => (
              <div 
                key={idx} 
                style={{ width: `${item.percent}%`, backgroundColor: item.color }} 
                className="h-full"
                title={`${item.label}: ${item.percent.toFixed(1)}%`}
              />
            ))}
          </div>

          <div className="space-y-2">
            {Object.values(allocation).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-[#0c0c0e] border border-zinc-800/80 rounded">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">{item.label}</span>
                    <span className="text-[11px] font-mono-nums text-zinc-500">{formatBRL(item.value)}</span>
                  </div>
                </div>
                <span className="font-mono-nums text-xs font-semibold text-zinc-100">{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth Evolution */}
        <div className="surface-card p-5 space-y-5">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold text-zinc-100">Trajetória do Patrimônio</h2>
            <span className="font-mono-nums text-xs font-semibold text-emerald-400">
              {(((netWorth - 10000000) / 10000000) * 100).toFixed(2)}% Total
            </span>
          </div>

          <div className="w-full bg-[#0c0c0e] border border-zinc-800 rounded p-3">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-44 overflow-visible"
            >
              <line x1="20" y1="35" x2={chartWidth - 20} y2="35" stroke="#27272a" strokeDasharray="3" />
              <line x1="20" y1="90" x2={chartWidth - 20} y2="90" stroke="#27272a" strokeDasharray="3" />
              <line x1="20" y1={chartHeight - 25} x2={chartWidth - 20} y2={chartHeight - 25} stroke="#3f3f46" />

              <polygon points={areaPoints} fill="rgba(255, 255, 255, 0.03)" />

              <polyline 
                points={svgPoints} 
                fill="none" 
                stroke="#e4e4e7" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {evolutionPoints.map((pt, idx) => {
                const x = (idx / (evolutionPoints.length - 1)) * (chartWidth - 40) + 20
                const y = chartHeight - 25 - ((pt.value - minVal) / range) * (chartHeight - 50)
                return (
                  <circle 
                    key={idx} 
                    cx={x} 
                    cy={y} 
                    r="3.5" 
                    fill="#09090b" 
                    stroke="#e4e4e7" 
                    strokeWidth="1.5" 
                  />
                )
              })}
            </svg>

            <div className="flex justify-between items-center px-2 pt-2 text-[10px] text-zinc-500 font-mono-nums uppercase">
              {evolutionPoints.map((pt, idx) => (
                <span key={idx}>{pt.label}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
              <span className="text-[10px] text-zinc-500 font-medium uppercase block">Capital Base</span>
              <span className="font-mono-nums text-xs font-semibold text-zinc-200 block mt-0.5">R$ 10.000.000,00</span>
            </div>
            <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded">
              <span className="text-[10px] text-zinc-500 font-medium uppercase block">Patrimônio Líquido</span>
              <span className="font-mono-nums text-xs font-semibold text-zinc-100 block mt-0.5">{formatBRL(netWorth)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
