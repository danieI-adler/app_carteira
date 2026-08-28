import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import useOrders from '../hooks/useOrders'
import OrderForm from '../components/business/OrderForm'
import { autoUpdatePricesClientSide } from '../utils/priceSync'
import { useAuth } from '../context/AuthContext'

export default function Market() {
  const [assets, setAssets] = useState([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const { orders, loading: ordersLoading, createOrder, cancelOrder } = useOrders()
  const [filterQuery, setFilterQuery] = useState('')
  const { profile } = useAuth()

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
          // Trigger background update if older than 1 hour
          autoUpdatePricesClientSide(data).then(() => {
            // Fetch again silently to show updated prices
            supabase
              .from('assets')
              .select('*')
              .order('symbol')
              .then(({ data: freshData }) => {
                if (freshData) setAssets(freshData)
              })
          })
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
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/5 shadow-2xl relative z-10">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Painel de Negociação</span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Mercado de Ativos</h1>
          <p className="text-slate-400 text-xs mt-1">Negocie ativos reais da B3 com fundos virtuais da sua equipe.</p>
        </div>
        <nav className="flex gap-2">
          <Link
            to="/"
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Ver Carteira
          </Link>
          <Link
            to="/ranking"
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Classificação
          </Link>
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-indigo-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Painel Admin
            </Link>
          )}
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Columns: Stock list */}
        <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Cotações Disponíveis</h2>
            
            {/* Filter Input for loaded assets */}
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Filtrar ativo... (Ex: WEGE3)"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all w-full sm:w-60 placeholder-slate-500 uppercase"
              />
            </div>
          </div>

          {assetsLoading ? (
            <div className="text-center py-16 text-slate-500">Carregando cotações da B3...</div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider sticky top-0 bg-[#030712]/90 backdrop-blur pb-2 z-10">
                    <th className="py-3">Ativo</th>
                    <th className="py-3">Nome da Empresa</th>
                    <th className="py-3">Classe</th>
                    <th className="py-3 text-right">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assets.filter(asset => 
                    asset.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
                    asset.name.toLowerCase().includes(filterQuery.toLowerCase())
                  ).map((asset) => (
                    <tr key={asset.symbol} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5">
                        <span className="font-black text-indigo-400 bg-indigo-950/20 px-2.5 py-1 rounded-lg border border-indigo-900/30 text-xs">
                          {asset.symbol}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-350 font-medium text-xs max-w-[200px] truncate">{asset.name}</td>
                      <td className="py-3.5 text-slate-400 capitalize text-xs">{asset.type}</td>
                      <td className="py-3.5 text-right text-emerald-450 font-bold">{formatBRL(asset.last_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right column: Order Form */}
        <section className="lg:col-span-1 h-fit">
          <OrderForm onCreateOrder={createOrder} />
        </section>

        {/* Bottom column: Active Orders List */}
        <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl lg:col-span-3 space-y-6">
          <h2 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-3">Suas Ordens</h2>
          {ordersLoading ? (
            <div className="text-center py-10 text-slate-500">Carregando ordens...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-550">Você ainda não registrou nenhuma ordem.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3">Ativo</th>
                    <th className="py-3">Tipo</th>
                    <th className="py-3">Operação</th>
                    <th className="py-3 text-right">Quantidade</th>
                    <th className="py-3 text-right">Preço Limite</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => {
                    let badgeColor = 'bg-slate-950 text-slate-400 border-slate-900'
                    if (order.status === 'executed') badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                    if (order.status === 'cancelled') badgeColor = 'bg-rose-950/40 text-rose-450 border-rose-900/30'
                    if (order.status === 'pending') badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-900/30'

                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <span className="font-bold text-white">{order.asset_symbol}</span>
                        </td>
                        <td className="py-3.5 text-slate-350 capitalize text-xs">{order.order_type}</td>
                        <td className="py-3.5 capitalize text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.side === 'buy' ? 'text-indigo-400 bg-indigo-950/20' : 'text-purple-400 bg-purple-950/20'}`}>
                            {order.side === 'buy' ? 'compra' : 'venda'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-medium text-slate-200">{order.quantity}</td>
                        <td className="py-3.5 text-right text-slate-350">
                          {order.limit_price ? formatBRL(order.limit_price) : '-'}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeColor}`}>
                            {order.status === 'executed' ? 'Executada' : order.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
