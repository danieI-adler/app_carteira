import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import useOrders from '../hooks/useOrders'
import OrderForm from '../components/business/OrderForm'

export default function Market() {
  const [assets, setAssets] = useState([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const { orders, loading: ordersLoading, createOrder, cancelOrder } = useOrders()

  useEffect(() => {
    async function fetchAssets() {
      try {
        setAssetsLoading(true)
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .order('symbol')
        if (!error && data) {
          setAssets(data)
        }
      } catch (err) {
        console.error('Error fetching assets:', err)
      } finally {
        setAssetsLoading(false)
      }
    }
    fetchAssets()
  }, [])

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mercado de Ativos</h1>
          <p className="text-slate-400 mt-1">Negocie ativos reais da B3 sem dinheiro real.</p>
        </div>
        <nav className="flex gap-4">
          <Link
            to="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            Ver Carteira
          </Link>
          <Link
            to="/ranking"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            Classificação
          </Link>
          <Link
            to="/admin"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            Painel Admin
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assets List */}
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Cotações Disponíveis</h2>
          {assetsLoading ? (
            <div className="text-center py-12 text-slate-500">Carregando cotações...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2">Ativo</th>
                    <th className="py-2">Nome</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2 text-right">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.symbol} className="border-b border-slate-800 hover:bg-slate-750/30">
                      <td className="py-3 font-semibold text-indigo-400">{asset.symbol}</td>
                      <td className="py-3 text-slate-300">{asset.name}</td>
                      <td className="py-3 text-slate-400 capitalize">{asset.type}</td>
                      <td className="py-3 text-right text-emerald-450 font-medium">
                        {formatBRL(asset.last_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Order Form */}
        <section>
          <OrderForm onCreateOrder={createOrder} />
        </section>

        {/* Active Orders List */}
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-4">Suas Ordens</h2>
          {ordersLoading ? (
            <div className="text-center py-6 text-slate-500">Carregando ordens...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-6 text-slate-500">Nenhuma ordem registrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2">Ativo</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2">Operação</th>
                    <th className="py-2 text-right">Qtd</th>
                    <th className="py-2 text-right">Preço Limite</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    let statusColor = 'text-slate-400'
                    if (order.status === 'executed') statusColor = 'text-emerald-450'
                    if (order.status === 'cancelled') statusColor = 'text-rose-450'
                    if (order.status === 'pending') statusColor = 'text-amber-400'

                    return (
                      <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-750/30">
                        <td className="py-3 font-semibold text-white">{order.asset_symbol}</td>
                        <td className="py-3 text-slate-300 capitalize">{order.order_type}</td>
                        <td className="py-3 text-slate-350 capitalize">{order.side}</td>
                        <td className="py-3 text-right">{order.quantity}</td>
                        <td className="py-3 text-right">
                          {order.limit_price ? formatBRL(order.limit_price) : '-'}
                        </td>
                        <td className={`py-3 capitalize ${statusColor}`}>{order.status}</td>
                        <td className="py-3 text-right">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="px-2.5 py-1 bg-rose-950/40 text-rose-400 hover:bg-rose-900 border border-rose-900/50 rounded text-xs font-semibold transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
