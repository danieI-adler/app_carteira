import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import useOrders from '../hooks/useOrders'
import OrderForm from '../components/business/OrderForm'
import { autoUpdatePricesClientSide } from '../utils/priceSync'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Plus
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
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Negociação</div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-0.5">Mercado de Ativos</h1>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Quotes list */}
        <div className="surface-card lg:col-span-2 h-fit">
          <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <button
              onClick={() => setIsQuotesOpen(!isQuotesOpen)}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-300">
                Livro de Cotações (B3)
              </h2>
              <span className="text-zinc-500 group-hover:text-zinc-300">
                {isQuotesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </button>
            
            {/* Search Input */}
            {isQuotesOpen && (
              <div className="relative w-full sm:w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filtrar por sigla ou nome..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full input-institutional pl-8 pr-3 py-1.5 text-xs uppercase"
                />
              </div>
            )}
          </div>

          {/* Category Tabs */}
          {isQuotesOpen && (
            <div className="px-4 py-2 bg-[#0c0c0e] border-b border-zinc-800 flex gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'Todos os Ativos' },
                { id: 'acao', label: 'Ações' },
                { id: 'fii', label: 'FIIs' },
                { id: 'etf', label: 'ETFs' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Table */}
          {isQuotesOpen && (
            assetsLoading ? (
              <div className="text-center py-12 text-zinc-500 text-xs">Carregando cotações...</div>
            ) : (
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e] sticky top-0 z-10">
                      <th className="py-2.5 px-4 font-medium min-w-[80px]">Sigla</th>
                      <th className="py-2.5 px-4 font-medium">Nome do Ativo</th>
                      <th className="py-2.5 px-4 font-medium">Classe</th>
                      <th className="py-2.5 px-4 text-right font-medium min-w-[100px]">Cotação</th>
                      <th className="py-2.5 px-4 text-right font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredAssets.map((asset) => (
                      <tr 
                        key={asset.symbol} 
                        className="table-row-hover font-mono-nums cursor-pointer"
                        onClick={() => setSelectedAssetSymbol(asset.symbol)}
                      >
                        <td className="py-2.5 px-4 font-semibold text-zinc-100">{asset.symbol}</td>
                        <td className="py-2.5 px-4 text-zinc-300 font-sans max-w-[200px] truncate">{asset.name}</td>
                        <td className="py-2.5 px-4 uppercase text-[11px] text-zinc-400 font-sans">{asset.type}</td>
                        <td className="py-2.5 px-4 text-right text-zinc-100 font-semibold whitespace-nowrap">
                          {formatBRL(asset.last_price)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAssetSymbol(asset.symbol)
                            }}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors"
                            title={`Selecionar ${asset.symbol}`}
                          >
                            <Plus size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Right column: Order Form */}
        <div className="lg:col-span-1 h-fit">
          <OrderForm 
            onCreateOrder={createOrder} 
            defaultSymbol={selectedAssetSymbol} 
          />
        </div>

        {/* Bottom column: Active Orders */}
        <div className="surface-card lg:col-span-3">
          <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Suas Ordens de Mercado</h2>
            <span className="text-xs text-zinc-500 font-mono-nums">{orders.length} ordens</span>
          </div>

          {ordersLoading ? (
            <div className="text-center py-8 text-zinc-500 text-xs">Carregando ordens...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">Nenhuma ordem registrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e]">
                    <th className="py-2.5 px-4 font-medium">Ativo</th>
                    <th className="py-2.5 px-4 font-medium">Tipo</th>
                    <th className="py-2.5 px-4 font-medium">Operação</th>
                    <th className="py-2.5 px-4 text-right font-medium">Quantidade</th>
                    <th className="py-2.5 px-4 text-right font-medium min-w-[110px]">Preço Limite</th>
                    <th className="py-2.5 px-4 font-medium min-w-[100px]">Status</th>
                    <th className="py-2.5 px-4 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {orders.map((order) => {
                    let statusClass = 'text-zinc-500'
                    if (order.status === 'executed') statusClass = 'text-emerald-400 font-medium'
                    else if (order.status === 'cancelled') statusClass = 'text-red-400 font-medium'
                    else if (order.status === 'pending') statusClass = 'text-amber-400 font-medium'

                    return (
                      <tr key={order.id} className="table-row-hover font-mono-nums">
                        <td className="py-2.5 px-4 font-semibold text-zinc-100">{order.asset_symbol}</td>
                        <td className="py-2.5 px-4 uppercase text-[11px] text-zinc-400 font-sans">{order.order_type}</td>
                        <td className="py-2.5 px-4 font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${order.side === 'buy' ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                            {order.side === 'buy' ? 'compra' : 'venda'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-200">{order.quantity.toLocaleString('pt-BR')}</td>
                        <td className="py-2.5 px-4 text-right text-zinc-300 whitespace-nowrap">
                          {order.limit_price ? formatBRL(order.limit_price) : '—'}
                        </td>
                        <td className={`py-2.5 px-4 capitalize font-sans ${statusClass}`}>
                          {order.status === 'executed' ? 'Executada' : order.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-sans">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
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
        </div>
      </main>
    </div>
  )
}
