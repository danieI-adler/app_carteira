import usePortfolio from '../hooks/usePortfolio'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-100 rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 font-medium">Carregando portfólio...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="surface-card p-6 max-w-md mx-auto text-center space-y-2 border-red-900/40">
        <h2 className="text-sm font-semibold text-red-400">Falha ao carregar dados</h2>
        <p className="text-xs text-zinc-400">{error}</p>
      </div>
    )
  }

  const teamName = team?.name || 'Equipe'
  const balance = team?.balance ?? 100000000.00
  const netWorth = team?.net_worth ?? 100000000.00
  const totalProfit = netWorth - 100000000.00
  const profitPercent = (totalProfit / 100000000.00) * 100
  const monthlySavingsYield = balance * 0.005

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800 pb-4">
        <div>
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Portfólio Institucional</div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-0.5">{teamName}</h1>
        </div>
        <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Patrimônio Líquido</span>
          <span className="font-mono-nums text-xl font-semibold text-zinc-100">{formatBRL(netWorth)}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Metric 1 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Caixa Disponível</span>
          <div className="font-mono-nums text-lg font-semibold text-zinc-100">{formatBRL(balance)}</div>
          <div className="text-[11px] text-zinc-400">Poupança Automática (0,5% a.m.)</div>
        </div>

        {/* Metric 2 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Rendimento Poupança</span>
          <div className="font-mono-nums text-lg font-semibold text-emerald-400">+{formatBRL(monthlySavingsYield)}</div>
          <div className="text-[11px] text-zinc-400">Projeção mensal sobre caixa livre</div>
        </div>

        {/* Metric 3 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Retorno Acumulado</span>
          <div className={`font-mono-nums text-lg font-semibold flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{totalProfit >= 0 ? '+' : ''}{formatBRL(totalProfit)}</span>
          </div>
          <div className={`text-[11px] font-medium ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% sobre R$ 100M base
          </div>
        </div>

        {/* Metric 4 */}
        <div className="surface-card p-4 space-y-1">
          <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Posições em Carteira</span>
          <div className="font-mono-nums text-lg font-semibold text-zinc-100">{positions.length} ativos</div>
          <div className="text-[11px] text-zinc-400">
            {((((netWorth - balance) / (netWorth || 1)) * 100)).toFixed(1)}% do capital alocado
          </div>
        </div>

      </div>

      {/* Custody Positions */}
      <div className="surface-card">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Posições em Custódia</h2>
          <span className="text-xs text-zinc-500 font-mono-nums">{positions.length} posições</span>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Nenhuma posição em custódia. Acesse o Mercado para executar ordens.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e]">
                  <th className="py-2.5 px-4 font-medium">Ativo</th>
                  <th className="py-2.5 px-4 font-medium">Tipo</th>
                  <th className="py-2.5 px-4 text-right font-medium">Quantidade</th>
                  <th className="py-2.5 px-4 text-right font-medium">Preço Médio</th>
                  <th className="py-2.5 px-4 text-right font-medium">Cotação Atual</th>
                  <th className="py-2.5 px-4 text-right font-medium">Valor Total</th>
                  <th className="py-2.5 px-4 text-right font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {positions.map((pos, idx) => {
                  const price = pos.assets?.last_price || pos.average_price
                  const totalVal = pos.quantity * price
                  const posProfit = (price - pos.average_price) * pos.quantity
                  const profitPct = pos.average_price > 0 ? ((price - pos.average_price) / pos.average_price) * 100 : 0

                  return (
                    <tr key={idx} className="table-row-hover font-mono-nums">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-100">{pos.asset_symbol}</span>
                      </td>
                      <td className="py-3 px-4 uppercase text-[11px] text-zinc-400 font-sans">
                        {pos.assets?.type || 'Ação'}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-300">{pos.quantity.toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-right text-zinc-400">{formatBRL(pos.average_price)}</td>
                      <td className="py-3 px-4 text-right text-zinc-200">{formatBRL(price)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-zinc-100">{formatBRL(totalVal)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${posProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {posProfit >= 0 ? '+' : ''}{formatBRL(posProfit)}
                        </span>
                        <span className={`block text-[10px] ${posProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {posProfit >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="surface-card">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Histórico de Ordens Executadas</h2>
          <span className="text-xs text-zinc-500 font-mono-nums">{transactions.length} registros</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Nenhuma movimentação realizada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e]">
                  <th className="py-2.5 px-4 font-medium">Operação</th>
                  <th className="py-2.5 px-4 font-medium">Ativo</th>
                  <th className="py-2.5 px-4 text-right font-medium">Quantidade</th>
                  <th className="py-2.5 px-4 text-right font-medium">Preço Executado</th>
                  <th className="py-2.5 px-4 text-right font-medium">Volume Total</th>
                  <th className="py-2.5 px-4 text-right font-medium">Corretagem/Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {transactions.slice(0, 10).map((tx, idx) => {
                  const isBuy = tx.transaction_type === 'buy'
                  return (
                    <tr key={idx} className="table-row-hover font-mono-nums">
                      <td className="py-2.5 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${isBuy ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/60' : 'bg-red-950/50 text-red-400 border border-red-900/60'}`}>
                          {isBuy ? 'Compra' : 'Venda'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-200">{tx.asset_symbol}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-300">{tx.quantity.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-300">{formatBRL(tx.price)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-zinc-100">{formatBRL(tx.quantity * tx.price)}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-400">{formatBRL(tx.fee)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
