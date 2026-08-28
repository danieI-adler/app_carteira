import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import useOrders from '../hooks/useOrders'
import OrderForm from '../components/business/OrderForm'
import SpotlightCard from '../components/ui/SpotlightCard'
import { autoUpdatePricesClientSide } from '../utils/priceSync'
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle,
  PlusCircle
} from 'lucide-react'

export default function Market() {
  const [assets, setAssets] = useState([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const { orders, loading: ordersLoading, createOrder, cancelOrder } = useOrders()
  const [filterQuery, setFilterQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // all, acao, fii, etf
  const [isQuotesOpen, setIsQuotesOpen] = useState(true)
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('')

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
          autoUpdatePricesClientSide(data).then(() => {
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

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(filterQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || asset.type?.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
          <TrendingUp size={14} />
          <span>Home Broker</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Mercado de Ativos</h1>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Stock list (Retrátil com Filtros de Categoria) */}
        <SpotlightCard className="p-6 lg:col-span-2 space-y-5 h-fit">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <button
              onClick={() => setIsQuotesOpen(!isQuotesOpen)}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                Cotações da B3
              </h2>
              <span className="p-1 rounded-lg bg-slate-950 border border-white/10 text-slate-400 group-hover:text-white">
                {isQuotesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            
            {/* Search Input */}
            {isQuotesOpen && (
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar ticker ou nome..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all w-full placeholder-slate-600 uppercase"
                />
              </div>
            )}
          </div>

          {/* Category Pill Filters */}
          {isQuotesOpen && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: 'all', label: 'Todos os Ativos' },
                { id: 'acao', label: 'Ações' },
                { id: 'fii', label: 'FIIs' },
                { id: 'etf', label: 'ETFs' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Collapsible Table Content */}
          {isQuotesOpen && (
            assetsLoading ? (
              <div className="text-center py-16 text-slate-500">Carregando cotações em tempo real...</div>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider sticky top-0 bg-[#030712]/95 backdrop-blur z-10">
                      <th className="py-3 px-4 sm:px-6 min-w-[90px]">Ativo</th>
                      <th className="py-3 px-4 sm:px-6">Nome</th>
                      <th className="py-3 px-4 sm:px-6">Classe</th>
                      <th className="py-3 px-4 sm:px-6 text-right min-w-[120px]">Preço</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Negociar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAssets.map((asset) => (
                      <tr 
                        key={asset.symbol} 
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        onClick={() => setSelectedAssetSymbol(asset.symbol)}
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-black text-indigo-300 bg-indigo-950/50 px-2.5 py-1 rounded-xl border border-indigo-500/30 text-xs group-hover:border-indigo-400 transition-all">
                            {asset.symbol}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-350 font-medium text-xs max-w-[180px] truncate">{asset.name}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-400 capitalize text-xs">{asset.type}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-right text-emerald-400 font-bold whitespace-nowrap">
                          {formatBRL(asset.last_price)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAssetSymbol(asset.symbol)
                            }}
                            className="p-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 text-indigo-300 hover:text-white transition-all cursor-pointer"
                            title={`Selecionar ${asset.symbol} para ordem`}
                          >
                            <PlusCircle size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </SpotlightCard>

        {/* Right column: Order Form */}
        <section className="lg:col-span-1 h-fit">
          <OrderForm 
            onCreateOrder={createOrder} 
            defaultSymbol={selectedAssetSymbol} 
          />
        </section>

        {/* Bottom column: Active Orders List */}
        <SpotlightCard className="p-6 lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Suas Ordens</h2>
            <span className="text-xs text-slate-500">{orders.length} ordens registradas</span>
          </div>

          {ordersLoading ? (
            <div className="text-center py-10 text-slate-500">Carregando ordens...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-550">Você ainda não registrou nenhuma ordem.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6 min-w-[80px]">Ativo</th>
                    <th className="py-3 px-4 sm:px-6">Tipo</th>
                    <th className="py-3 px-4 sm:px-6">Operação</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Quantidade</th>
                    <th className="py-3 px-4 sm:px-6 text-right min-w-[130px]">Preço Limite</th>
                    <th className="py-3 px-4 sm:px-6 min-w-[120px]">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => {
                    let badgeColor = 'bg-slate-950 text-slate-400 border-slate-900'
                    let StatusIcon = Clock
                    if (order.status === 'executed') {
                      badgeColor = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                      StatusIcon = CheckCircle2
                    } else if (order.status === 'cancelled') {
                      badgeColor = 'bg-rose-950/50 text-rose-300 border-rose-800/40'
                      StatusIcon = XCircle
                    }

                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-bold text-white">{order.asset_symbol}</span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-350 capitalize text-xs">{order.order_type}</td>
                        <td className="py-3.5 px-4 sm:px-6 capitalize text-xs">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${order.side === 'buy' ? 'text-indigo-300 bg-indigo-950/40 border border-indigo-800/40' : 'text-rose-300 bg-rose-950/40 border border-rose-800/40'}`}>
                            {order.side === 'buy' ? 'compra' : 'venda'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-medium text-slate-200">{order.quantity}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-right text-slate-350 whitespace-nowrap">
                          {order.limit_price ? formatBRL(order.limit_price) : '-'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${badgeColor}`}>
                            <StatusIcon size={12} />
                            <span>{order.status === 'executed' ? 'Executada' : order.status === 'cancelled' ? 'Cancelada' : 'Pendente'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
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
        </SpotlightCard>
      </main>
    </div>
  )
}
