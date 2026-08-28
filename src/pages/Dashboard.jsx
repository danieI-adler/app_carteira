import usePortfolio from '../hooks/usePortfolio'
import { Wallet, Layers, History, ShieldCheck } from 'lucide-react'

export default function Dashboard() {
  const { team, positions, transactions, loading, error } = usePortfolio()

  // Format currency helper
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
        <h2 className="text-rose-450 font-bold text-xl">Erro de Conectividade</h2>
        <p className="text-slate-350 text-sm">{error}</p>
      </div>
    )
  }

  const teamName = team?.name || 'Equipe'
  const balance = team?.balance ?? 10000000.00
  const netWorth = team?.net_worth ?? 10000000.00
  const totalProfit = netWorth - 10000000.00
  const profitPercent = (totalProfit / 10000000.00) * 100

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Background neon elements */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/5 shadow-2xl relative z-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
            <Wallet size={16} />
            <span>Portfólio de Investimentos</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">{teamName}</h1>
          <p className="text-slate-400 text-xs mt-1">Acompanhe a posição consolidada da sua equipe.</p>
        </div>
        <div className="text-right border-l border-white/5 pl-6 hidden sm:block">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Patrimônio Líquido</span>
          <span className="text-2xl font-black text-neon-gradient">{formatBRL(netWorth)}</span>
        </div>
      </div>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Side: Financial Summary */}
        <div className="space-y-6 lg:col-span-1">
          {/* Mobile Net Worth */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl sm:hidden text-center">
            <span className="text-xs text-slate-450 uppercase font-bold tracking-wider">Patrimônio Líquido</span>
            <div className="text-3xl font-black text-white mt-1">{formatBRL(netWorth)}</div>
          </div>

          <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-3">Resumo Financeiro</h2>
            <div className="space-y-4">
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Caixa / Poupança Automática</span>
                  <span className="font-bold text-white text-sm">{formatBRL(balance)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <ShieldCheck size={13} />
                  <span>Rendendo 0,5% a.m. (livre para operar)</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-xs text-slate-400">Ativos em Carteira</span>
                <span className="font-bold text-white text-sm">{positions.length} ativos</span>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                <span className="text-xs text-slate-400">Retorno Total</span>
                <div className="text-right">
                  <span className={`font-black block text-sm ${totalProfit >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                    {totalProfit >= 0 ? '+' : ''}{formatBRL(totalProfit)}
                  </span>
                  <span className={`text-[11px] font-semibold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {totalProfit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

            </div>
          </section>
        </div>

        {/* Right Side: Portfolio Table */}
        <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Layers size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Posições em Custódia</h2>
          </div>

          {positions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-dashed border-white/5 rounded-xl">
              Você ainda não possui posições ativas. Acesse a aba Mercado para negociar papéis.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Ativo</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Quantidade</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Preço Médio</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Preço Atual</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Valor de Mercado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map((pos, idx) => {
                    const price = pos.assets?.last_price || pos.average_price
                    const totalVal = pos.quantity * price
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <span className="font-black text-indigo-400 bg-indigo-950/20 px-3 py-1 rounded-lg border border-indigo-900/30">
                            {pos.asset_symbol}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right text-slate-200 font-medium">{pos.quantity}</td>
                        <td className="py-4 px-4 sm:px-6 text-right text-slate-350">{formatBRL(pos.average_price)}</td>
                        <td className="py-4 px-4 sm:px-6 text-right text-slate-350 font-medium">{formatBRL(price)}</td>
                        <td className="py-4 px-4 sm:px-6 text-right text-emerald-400 font-bold">{formatBRL(totalVal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Bottom Area: Transactions */}
        <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <History size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Histórico Recente de Transações</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-550">
              Nenhuma movimentação realizada por esta equipe.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactions.slice(0, 10).map((tx, idx) => {
                const isBuy = tx.transaction_type === 'buy'
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-950/40 border border-white/5 rounded-xl hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${isBuy ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/50 text-rose-450 border border-rose-900/30'}`}>
                        {isBuy ? 'Compra' : 'Venda'}
                      </span>
                      <div>
                        <span className="font-bold text-white block">{tx.asset_symbol}</span>
                        <span className="text-[10px] text-slate-500">Taxa: {formatBRL(tx.fee)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-200 block">
                        {tx.quantity} un @ {formatBRL(tx.price)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
