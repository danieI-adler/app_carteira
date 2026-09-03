import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import useOrders from '../hooks/useOrders'
import OrderForm from '../components/business/OrderForm'
import AssetChartCard from '../components/business/AssetChartCard'
import { autoUpdatePricesClientSide } from '../utils/priceSync'
import { getMarketStatus } from '../utils/marketSchedule'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Plus, 
  Clock, 
  LayoutGrid, 
  Table as TableIcon,
  CheckSquare,
  Square
} from 'lucide-react'

export default function Market() {
  const [assets, setAssets] = useState([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const { orders, loading: ordersLoading, createOrder, cancelOrder } = useOrders()
  const [filterQuery, setFilterQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // all, acao, fii, etf
  const [isQuotesOpen, setIsQuotesOpen] = useState(true)
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' (DEFAULT) or 'charts' (SECOND OPTION)
  const [timeframe, setTimeframe] = useState('1w') // '1d', '1w', '1m'
  const [selectedSymbolsForCharts, setSelectedSymbolsForCharts] = useState([])

  const marketStatus = getMarketStatus()

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
          autoUpdatePricesClientSide()
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

  const toggleSelectForChart = (symbol, e) => {
    e.stopPropagation()
    setSelectedSymbolsForCharts(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    )
  }

  const selectAllFiltered = () => {
    const allFilteredSymbols = filteredAssets.map(a => a.symbol)
    setSelectedSymbolsForCharts(allFilteredSymbols)
  }

  const clearSelected = () => {
    setSelectedSymbolsForCharts([])
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(filterQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || asset.type?.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  // In chart view, if user selected specific symbols, show those or fallback to filtered
  const chartAssets = selectedSymbolsForCharts.length > 0
    ? assets.filter(a => selectedSymbolsForCharts.includes(a.symbol))
    : filteredAssets

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Market Status Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Negociação</div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-0.5">Mercado de Ativos</h1>
        </div>
        
        {/* Market Status Pill */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-2 ${
            marketStatus.isOpen 
              ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>{marketStatus.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Schedule Banner */}
      <div className="surface-card p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Clock size={15} className="text-zinc-500 shrink-0" />
          <span>
            <strong>Desafio Beta (04/09 a 02/10):</strong> Terças, Quintas e Fins de Semana (19h00 às 08h00).
          </span>
        </div>
        <div className="text-zinc-500 text-[11px]">
          {marketStatus.isOpen ? (
            <span className="text-emerald-400 font-medium">Pregão noturno ativo para envio de ordens</span>
          ) : (
            <span>Próxima abertura: <strong className="text-zinc-300">{marketStatus.nextOpening}</strong></span>
          )}
        </div>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Quotes list / Chart Grid */}
        <div className="surface-card lg:col-span-2 h-fit">
          <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsQuotesOpen(!isQuotesOpen)}
                className="flex items-center gap-2 text-left group cursor-pointer"
              >
                <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-300">
                  Cotações da B3
                </h2>
                <span className="text-zinc-500 group-hover:text-zinc-300">
                  {isQuotesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </span>
              </button>

              {/* View Mode Switcher (DEFAULT: Table / Lista, SECOND: Charts / Gráficos) */}
              {isQuotesOpen && (
                <div className="flex items-center bg-[#0c0c0e] border border-zinc-800 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Visualização em Lista / Tabela (Padrão)"
                  >
                    <TableIcon size={13} />
                    <span className="hidden sm:inline text-[11px]">Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('charts')}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'charts' ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Visualização em Gráficos"
                  >
                    <LayoutGrid size={13} />
                    <span className="hidden sm:inline text-[11px]">Gráficos</span>
                  </button>
                </div>
              )}
            </div>
            
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

          {/* Sub-header: Categories and Timeframe Selectors */}
          {isQuotesOpen && (
            <div className="px-4 py-2 bg-[#0c0c0e] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              {/* Category Tabs */}
              <div className="flex gap-1.5 overflow-x-auto">
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

              {/* Selection Controls & Timeframe Selector */}
              <div className="flex items-center gap-2">
                {viewMode === 'charts' && (
                  <>
                    {selectedSymbolsForCharts.length > 0 && (
                      <button
                        onClick={clearSelected}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                      >
                        Ver todos ({chartAssets.length})
                      </button>
                    )}

                    {/* Timeframe selector (1D, 1S, 1M) for chart view */}
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5">
                      <button
                        onClick={() => setTimeframe('1d')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-nums font-semibold transition-colors cursor-pointer ${
                          timeframe === '1d' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        1D
                      </button>
                      <button
                        onClick={() => setTimeframe('1w')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-nums font-semibold transition-colors cursor-pointer ${
                          timeframe === '1w' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        1S
                      </button>
                      <button
                        onClick={() => setTimeframe('1m')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-nums font-semibold transition-colors cursor-pointer ${
                          timeframe === '1m' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        1M
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Body: Table (DEFAULT) or Charts Grid */}
          {isQuotesOpen && (
            assetsLoading ? (
              <div className="text-center py-12 text-zinc-500 text-xs">Carregando cotações...</div>
            ) : viewMode === 'table' ? (
              /* VISUALIZAÇÃO PADRÃO: TABELA DE COTAÇÕES */
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e] sticky top-0 z-10">
                      <th className="py-2.5 px-3 w-8 text-center">
                        <button
                          onClick={selectAllFiltered}
                          title="Selecionar todos para ver em gráfico"
                          className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          <Square size={13} />
                        </button>
                      </th>
                      <th className="py-2.5 px-4 font-medium min-w-[80px]">Sigla</th>
                      <th className="py-2.5 px-4 font-medium">Nome do Ativo</th>
                      <th className="py-2.5 px-4 font-medium">Classe</th>
                      <th className="py-2.5 px-4 text-right font-medium min-w-[100px]">Cotação Oficial</th>
                      <th className="py-2.5 px-4 text-right font-medium">Negociar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredAssets.map((asset) => {
                      const isSelectedForChart = selectedSymbolsForCharts.includes(asset.symbol)
                      return (
                        <tr 
                          key={asset.symbol} 
                          className="table-row-hover font-mono-nums cursor-pointer"
                          onClick={() => setSelectedAssetSymbol(asset.symbol)}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectForChart(asset.symbol, e)}
                              className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
                              title="Marcar para exibir em gráfico"
                            >
                              {isSelectedForChart ? (
                                <CheckSquare size={14} className="text-emerald-400" />
                              ) : (
                                <Square size={14} />
                              )}
                            </button>
                          </td>
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* SEGUNDA OPÇÃO: GRID DE GRÁFICOS */
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto">
                {chartAssets.map((asset) => (
                  <AssetChartCard
                    key={asset.symbol}
                    asset={asset}
                    timeframe={timeframe}
                    onSelect={(symbol) => setSelectedAssetSymbol(symbol)}
                  />
                ))}
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
            <h2 className="text-sm font-semibold text-zinc-100">Ordens da Equipe</h2>
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
                          {order.status === 'executed' ? 'Executada (Abertura)' : order.status === 'cancelled' ? 'Cancelada' : 'Pendente Abertura'}
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
