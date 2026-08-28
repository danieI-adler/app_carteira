import { useMemo } from 'react'
import usePortfolio from '../hooks/usePortfolio'
import { 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react'

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
  const monthlySavingsYield = balance * 0.005 // 0.5% ao mês

  // Allocation calculation
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
        label: 'Poupança / Caixa Livre',
        value: balance,
        percent: Math.max(0, (balance / totalPortfolio) * 100),
        color: '#6366f1', // indigo
        bgClass: 'bg-indigo-500',
      },
      acoes: {
        label: 'Ações B3',
        value: acoesVal,
        percent: Math.max(0, (acoesVal / totalPortfolio) * 100),
        color: '#10b981', // emerald
        bgClass: 'bg-emerald-500',
      },
      fiis: {
        label: 'Fundos Imobiliários (FIIs)',
        value: fiisVal,
        percent: Math.max(0, (fiisVal / totalPortfolio) * 100),
        color: '#a855f7', // purple
        bgClass: 'bg-purple-500',
      },
      etfs: {
        label: 'ETFs & Índices',
        value: etfsVal,
        percent: Math.max(0, (etfsVal / totalPortfolio) * 100),
        color: '#f59e0b', // amber
        bgClass: 'bg-amber-500',
      },
    }
  }, [positions, balance, netWorth])

  // Simulated / historical evolution points for SVG chart
  const evolutionPoints = useMemo(() => {
    const initial = 10000000
    const current = netWorth
    const diff = current - initial

    // Generate 6 sample timeline points showing progression up to current net worth
    return [
      { label: 'Início', value: initial },
      { label: 'Sem 1', value: initial + diff * 0.15 },
      { label: 'Sem 2', value: initial + diff * 0.35 },
      { label: 'Sem 3', value: initial + diff * 0.60 },
      { label: 'Sem 4', value: initial + diff * 0.85 },
      { label: 'Atual', value: current },
    ]
  }, [netWorth])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Calculando métricas e gráficos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card border border-rose-900/30 p-8 rounded-2xl max-w-md mx-auto text-center space-y-4">
        <h2 className="text-rose-450 font-bold text-xl">Erro</h2>
        <p className="text-slate-350 text-sm">{error}</p>
      </div>
    )
  }

  // Calculate SVG Polyline points
  const minVal = Math.min(...evolutionPoints.map(p => p.value)) * 0.99
  const maxVal = Math.max(...evolutionPoints.map(p => p.value)) * 1.01
  const range = maxVal - minVal || 1
  const chartWidth = 700
  const chartHeight = 220

  const svgPoints = evolutionPoints.map((pt, idx) => {
    const x = (idx / (evolutionPoints.length - 1)) * (chartWidth - 40) + 20
    const y = chartHeight - 30 - ((pt.value - minVal) / range) * (chartHeight - 60)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `20,${chartHeight - 30} ${svgPoints} ${chartWidth - 20},${chartHeight - 30}`

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-2xl relative z-10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
          <PieIcon size={16} />
          <span>Inteligência de Portfólio</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Gráficos & Análise</h1>
        <p className="text-slate-400 text-xs mt-1">
          Acompanhe a alocação de classes de ativos, evolução do patrimônio e rentabilidade da poupança automática.
        </p>
      </div>

      {/* Automatic Savings Highlight Card */}
      <section className="glass-card rounded-2xl p-6 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Poupança Automática Ativa (0,5% a.m.)</span>
            </div>
            <h2 className="text-xl font-black text-white">Rendimento Contínuo sobre Caixa Livre</h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              Todo o capital não aplicado em ações, FIIs ou ETFs fica automaticamente alocado na poupança com rendimento de 
              <strong className="text-white font-bold"> 0,5% ao mês</strong> e <strong className="text-white font-bold">liquidez imediata</strong> para compras no mercado.
            </p>
          </div>
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 min-w-[240px] text-right space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rendimento Estimado / Mês</span>
            <span className="text-2xl font-black text-emerald-400 block">+{formatBRL(monthlySavingsYield)}</span>
            <span className="text-[11px] text-slate-400 block">Sobre {formatBRL(balance)} em caixa</span>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Asset Allocation Chart */}
        <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Composição da Carteira</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribuição percentual por classe de ativos</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950 border border-white/5 text-slate-300">
              {positions.length + 1} classes
            </span>
          </div>

          {/* Allocation Visual Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 rounded-full bg-slate-950 border border-white/5 overflow-hidden flex">
              {Object.values(allocation).map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }} 
                  className="h-full transition-all duration-500"
                  title={`${item.label}: ${item.percent.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>

          {/* Asset Breakdown List */}
          <div className="space-y-3 pt-2">
            {Object.values(allocation).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-sm font-bold text-white block">{item.label}</span>
                    <span className="text-xs text-slate-400">{formatBRL(item.value)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white">{item.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Wealth Evolution Chart */}
        <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Evolução do Patrimônio</h2>
              <p className="text-xs text-slate-400 mt-0.5">Trajetória de valorização da equipe</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <TrendingUp size={16} />
              <span>{(((netWorth - 10000000) / 10000000) * 100).toFixed(2)}% Total</span>
            </div>
          </div>

          {/* Custom SVG Line & Area Chart */}
          <div className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-48 overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Grid lines */}
              <line x1="20" y1="40" x2={chartWidth - 20} y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="20" y1="100" x2={chartWidth - 20} y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="20" y1={chartHeight - 30} x2={chartWidth - 20} y2={chartHeight - 30} stroke="rgba(255,255,255,0.1)" />

              {/* Gradient Fill Area */}
              <polygon points={areaPoints} fill="url(#chartGradient)" />

              {/* Stroke Line */}
              <polyline 
                points={svgPoints} 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Data points circles */}
              {evolutionPoints.map((pt, idx) => {
                const x = (idx / (evolutionPoints.length - 1)) * (chartWidth - 40) + 20
                const y = chartHeight - 30 - ((pt.value - minVal) / range) * (chartHeight - 60)
                return (
                  <circle 
                    key={idx} 
                    cx={x} 
                    cy={y} 
                    r="5" 
                    fill="#1e1b4b" 
                    stroke="#a855f7" 
                    strokeWidth="2.5" 
                  />
                )
              })}
            </svg>

            {/* Labels below chart */}
            <div className="flex justify-between items-center px-4 pt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {evolutionPoints.map((pt, idx) => (
                <span key={idx}>{pt.label}</span>
              ))}
            </div>
          </div>

          {/* Key Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capital Inicial</span>
              <span className="text-base font-bold text-slate-200 block">R$ 10.000.000,00</span>
            </div>
            <div className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patrimônio Líquido</span>
              <span className="text-base font-black text-neon-gradient block">{formatBRL(netWorth)}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
