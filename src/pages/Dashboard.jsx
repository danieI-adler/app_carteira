import usePortfolio from '../hooks/usePortfolio'
import SpotlightCard from '../components/ui/SpotlightCard'
import { Wallet, Layers, History, ShieldCheck, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react'

export default function Dashboard() {
  const { team, positions, transactions, loading, error } = usePortfolio()

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Carregando dados da carteira...</p>
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

  const teamName = team?.name || 'Equipe'
  const balance = team?.balance ?? 10000000.00
  const netWorth = team?.net_worth ?? 10000000.00
  const totalProfit = netWorth - 10000000.00
  const profitPercent = (totalProfit / 10000000.00) * 100
  const monthlySavingsYield = balance * 0.005

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            <span>Visão Geral</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">{teamName}</h1>
        </div>
      </div>

      {/* BENTO GRID: Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Patrimônio Líquido Principal */}
        <SpotlightCard className="p-6 md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Patrimônio Líquido Total</span>
              <div className="text-4xl font-black text-neon-gradient">{formatBRL(netWorth)}</div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black ${totalProfit >= 0 ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40' : 'bg-rose-950/50 text-rose-450 border-rose-800/40'}`}>
              <TrendingUp size={14} />
              <span>{totalProfit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Lucro/Prejuízo:</span>
              <span className={`font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                {totalProfit >= 0 ? '+' : ''}{formatBRL(totalProfit)}
              </span>
            </div>
            <div className="text-slate-500">Capital Base: R$ 10.000.000,00</div>
          </div>
        </SpotlightCard>

        {/* Card 2: Poupança Automática (0,5% a.m.) */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-indigo-950/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Poupança Automática</span>
            </div>
            <span className="text-xs text-slate-400 block">Caixa Livre (Rendimento 0,5% a.m.)</span>
            <div className="text-2xl font-black text-white">{formatBRL(balance)}</div>
          </div>
          <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-400">Rendimento estimado:</span>
            <span className="font-bold text-emerald-400">+{formatBRL(monthlySavingsYield)}/mês</span>
          </div>
        </SpotlightCard>

      </div>

      {/* BENTO GRID: Positions & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Custody Positions Table */}
        <SpotlightCard className="p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Posições em Custódia</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-slate-300">
              {positions.length} ativos
            </span>
          </div>

          {positions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-dashed border-white/5 rounded-2xl">
              Nenhuma posição aberta no momento. Acesse a aba Mercado para negociar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Ativo</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Qtd</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Preço Médio</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Preço Atual</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Valor de Mercado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map((pos, idx) => {
                    const price = pos.assets?.last_price || pos.average_price
                    const totalVal = pos.quantity * price
                    const posProfit = (price - pos.average_price) * pos.quantity
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-indigo-300 bg-indigo-950/50 px-3 py-1 rounded-xl border border-indigo-500/30 text-xs shadow-sm">
                              {pos.asset_symbol}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 hidden sm:inline">
                              {pos.assets?.type || 'Ação'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right text-slate-200 font-medium">{pos.quantity}</td>
                        <td className="py-4 px-4 sm:px-6 text-right text-slate-400">{formatBRL(pos.average_price)}</td>
                        <td className="py-4 px-4 sm:px-6 text-right text-slate-300 font-medium">{formatBRL(price)}</td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <span className="font-bold text-emerald-400 block">{formatBRL(totalVal)}</span>
                          <span className={`text-[10px] font-semibold ${posProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {posProfit >= 0 ? '+' : ''}{formatBRL(posProfit)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SpotlightCard>

        {/* Quick Allocation Summary */}
        <SpotlightCard className="p-6 space-y-5 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Wallet size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Composição Rápida</h2>
          </div>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <span className="text-slate-400">Caixa Líquido</span>
              <span className="font-bold text-white">{((balance / (netWorth || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
              <span className="text-slate-400">Ativos Aplicados</span>
              <span className="font-bold text-emerald-400">{(((netWorth - balance) / (netWorth || 1)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </SpotlightCard>

        {/* Transactions Timeline */}
        <SpotlightCard className="p-6 lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Histórico de Transações</h2>
            </div>
            <span className="text-xs text-slate-500">Últimas operações</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-550">
              Nenhuma movimentação registrada por esta equipe.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactions.slice(0, 8).map((tx, idx) => {
                const isBuy = tx.transaction_type === 'buy'
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${isBuy ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40' : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'}`}>
                        {isBuy ? <ArrowUpRight size={12} /> : null}
                        <span>{isBuy ? 'Compra' : 'Venda'}</span>
                      </span>
                      <div>
                        <span className="font-black text-white block text-sm">{tx.asset_symbol}</span>
                        <span className="text-[10px] text-slate-500">Taxa B3: {formatBRL(tx.fee)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-200 block text-sm">
                        {tx.quantity} un @ {formatBRL(tx.price)}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-400">
                        {formatBRL(tx.quantity * tx.price)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SpotlightCard>

      </div>
    </div>
  )
}
