import { Link } from 'react-router-dom'
import usePortfolio from '../hooks/usePortfolio'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { team, positions, transactions, loading, error } = usePortfolio()
  const { signOut } = useAuth()

  // Format currency helper
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Carregando dados da carteira...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-rose-950/20 border border-rose-900/50 p-6 rounded-xl max-w-md w-full text-center">
          <h2 className="text-rose-400 font-bold text-lg mb-2">Erro de Conectividade</h2>
          <p className="text-slate-300 text-sm mb-4">{error}</p>
          <p className="text-xs text-slate-500">Configure as chaves do Supabase locais no arquivo .env</p>
        </div>
      </div>
    )
  }

  const teamName = team?.name || 'Equipe de Testes'
  const balance = team?.balance ?? 10000000.00
  const netWorth = team?.net_worth ?? 10000000.00
  const totalProfit = netWorth - 10000000.00
  const profitPercent = (totalProfit / 10000000.00) * 100

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{teamName}</h1>
          <p className="text-slate-400 mt-1">Bem-vindo à sua carteira de simulação.</p>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex gap-4">
            <Link
              to="/mercado"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Negociar Ativos (Mercado)
            </Link>
            <Link
              to="/ranking"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
            >
              Classificação
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors"
            >
              Painel Admin
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/50 text-rose-400 rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              Sair
            </button>
          </nav>
          <div className="text-right border-l border-slate-800 pl-6">
            <span className="text-sm text-slate-400 block">Patrimônio Líquido</span>
            <span className="text-xl font-bold text-emerald-400">{formatBRL(netWorth)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Summary */}
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Resumo da Conta</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Caixa Disponível</span>
              <span className="font-medium text-slate-200">{formatBRL(balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total de Posições</span>
              <span className="font-medium text-slate-200">{positions.length} ativos</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-3">
              <span className="text-slate-400">Lucro/Prejuízo Total</span>
              <span className={`font-medium ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                {formatBRL(totalProfit)} ({profitPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </section>

        {/* Portfolio Table */}
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Seu Portfólio</h2>
          {positions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
              Você ainda não possui posições ativas. Envie ordens para negociar ativos B3.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2">Ativo</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2 text-right">Qtd</th>
                    <th className="py-2 text-right">Preço Médio</th>
                    <th className="py-2 text-right">Preço Atual</th>
                    <th className="py-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, idx) => {
                    const price = pos.assets?.last_price || pos.average_price
                    const totalVal = pos.quantity * price
                    return (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-750/30">
                        <td className="py-3 font-semibold text-white">{pos.asset_symbol}</td>
                        <td className="py-3 text-slate-450 capitalize">{pos.position_type}</td>
                        <td className="py-3 text-right">{pos.quantity}</td>
                        <td className="py-3 text-right">{formatBRL(pos.average_price)}</td>
                        <td className="py-3 text-right">{formatBRL(price)}</td>
                        <td className="py-3 text-right text-emerald-400">{formatBRL(totalVal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Last Transactions */}
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm md:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-4">Últimas Transações</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              Nenhuma transação registrada.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-lg border border-slate-850">
                  <div>
                    <span className="font-semibold text-white block">{tx.asset_symbol}</span>
                    <span className="text-xs text-slate-500 capitalize">{tx.transaction_type}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-slate-200 block">
                      {tx.quantity} un @ {formatBRL(tx.price)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Taxa: {formatBRL(tx.fee)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
