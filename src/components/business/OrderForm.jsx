/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import usePortfolio from '../../hooks/usePortfolio'
import { getMarketStatus } from '../../utils/marketSchedule'

export default function OrderForm({ onCreateOrder, defaultSymbol }) {
  const { team, positions } = usePortfolio()
  const [assets, setAssets] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol || '')
  const [side, setSide] = useState('buy') // buy, sell, short, cover
  const [orderType, setOrderType] = useState('market') // market, limit
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const marketStatus = getMarketStatus()

  useEffect(() => {
    async function fetchAssets() {
      const { data, error: dbError } = await supabase
        .from('assets')
        .select('symbol, name, last_price, type')
        .order('symbol')
      if (!dbError && data) {
        setAssets(data)
        if (!selectedSymbol && data.length > 0) {
          setSelectedSymbol(data[0].symbol)
        }
      }
    }
    fetchAssets()
  }, [selectedSymbol])

  useEffect(() => {
    if (defaultSymbol) {
      setSelectedSymbol(defaultSymbol)
    }
  }, [defaultSymbol])

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol)
  const availableBalance = team?.balance ?? 10000000.00
  const activePosition = positions.find((p) => p.asset_symbol === selectedSymbol)

  // Quick percentage calculation handler
  const handleQuickPercent = (percent) => {
    if (!selectedAsset || selectedAsset.last_price <= 0) return
    
    if (side === 'buy' || side === 'short') {
      const allocatableCash = availableBalance * (percent / 100)
      const targetPrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedAsset.last_price
      if (targetPrice > 0) {
        const calculatedQty = Math.floor(allocatableCash / targetPrice)
        setQuantity(calculatedQty > 0 ? calculatedQty.toString() : '1')
      }
    } else if (side === 'sell' && activePosition) {
      const calculatedQty = Math.floor(activePosition.quantity * (percent / 100))
      setQuantity(calculatedQty > 0 ? calculatedQty.toString() : '1')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!marketStatus.isOpen) {
      setError(`O mercado está fechado no momento. Próxima janela: ${marketStatus.nextOpening}.`)
      return
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError('Informe uma quantidade válida superior a zero.')
      return
    }

    const price = orderType === 'limit' ? parseFloat(limitPrice) : null
    if (orderType === 'limit' && (isNaN(price) || price <= 0)) {
      setError('Informe um preço limite válido.')
      return
    }

    try {
      setLoading(true)
      await onCreateOrder({
        assetSymbol: selectedSymbol,
        quantity: qty,
        orderType,
        side,
        limitPrice: price,
      })
      setMessage('Ordem registrada! Será executada com o preço de abertura da B3.')
      setQuantity('')
      setLimitPrice('')
    } catch (err) {
      setError(err.message || 'Erro ao enviar a ordem.')
    } finally {
      setLoading(false)
    }
  }

  const totalEstimate = selectedAsset && quantity ? (
    parseFloat(quantity) * (orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedAsset.last_price)
  ) : 0

  return (
    <div className="surface-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold text-zinc-100">Boleta de Negociação</h2>
        {selectedAsset && (
          <span className="font-mono-nums text-xs font-semibold text-zinc-300">
            R$ {selectedAsset.last_price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Execution Notice */}
      <div className="p-2.5 bg-[#0c0c0e] border border-zinc-800 rounded text-[11px] text-zinc-400 leading-relaxed">
        {marketStatus.isOpen ? (
          <span>
            <strong className="text-emerald-400 font-semibold">Pregão Noturno Aberto.</strong> Ordens a mercado serão executadas com o preço de abertura da B3.
          </span>
        ) : (
          <span>
            <strong className="text-amber-400 font-semibold">Mercado Fechado.</strong> Próxima abertura: {marketStatus.nextOpening}.
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Ativo */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-400">Ativo</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            disabled={!marketStatus.isOpen}
            className="w-full input-institutional px-3 py-2 text-xs font-semibold text-zinc-100 disabled:opacity-50"
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol} className="bg-[#111114] text-zinc-200">
                {a.symbol} — R$ {a.last_price.toFixed(2)} ({a.name})
              </option>
            ))}
          </select>
        </div>

        {/* Side Tabs (Compra / Venda / Short / Cover) */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-400">Operação</label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0c0c0e] border border-zinc-800 rounded-md">
            <button
              type="button"
              disabled={!marketStatus.isOpen}
              onClick={() => setSide('buy')}
              className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40 ${
                side === 'buy'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Compra
            </button>
            <button
              type="button"
              disabled={!marketStatus.isOpen}
              onClick={() => setSide('sell')}
              className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40 ${
                side === 'sell'
                  ? 'bg-red-950/80 text-red-300 border border-red-800/80 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Venda
            </button>
            <button
              type="button"
              disabled={!marketStatus.isOpen}
              onClick={() => setSide('short')}
              className={`py-1 text-[11px] rounded transition-colors cursor-pointer disabled:opacity-40 ${
                side === 'short'
                  ? 'bg-zinc-800 text-zinc-200 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Short
            </button>
            <button
              type="button"
              disabled={!marketStatus.isOpen}
              onClick={() => setSide('cover')}
              className={`py-1 text-[11px] rounded transition-colors cursor-pointer disabled:opacity-40 ${
                side === 'cover'
                  ? 'bg-zinc-800 text-zinc-200 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Cobrir
            </button>
          </div>
        </div>

        {/* Execution Type */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-400">Tipo de Execução</label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0c0c0e] border border-zinc-800 rounded-md">
            <button
              type="button"
              disabled={!marketStatus.isOpen}
              onClick={() => setOrderType('market')}
              className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40 ${
                orderType === 'market'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              A Mercado
            </button>
            <button
              type="button"
              disabled={!marketStatus.isOpen}
              onClick={() => setOrderType('limit')}
              className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-40 ${
                orderType === 'limit'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Limitada
            </button>
          </div>
        </div>

        {/* Quantity & Quick Chips */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-400">Quantidade</label>
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={!marketStatus.isOpen}
                  onClick={() => handleQuickPercent(pct)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono-nums bg-[#18181b] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-40"
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
          
          <input
            type="number"
            min="1"
            step="1"
            placeholder="0"
            value={quantity}
            disabled={!marketStatus.isOpen}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full input-institutional px-3 py-2 text-xs font-mono-nums text-zinc-100 disabled:opacity-50"
            required
          />
        </div>

        {/* Limit Price */}
        {orderType === 'limit' && (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">Preço Limite (R$)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={limitPrice}
              disabled={!marketStatus.isOpen}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full input-institutional px-3 py-2 text-xs font-mono-nums text-zinc-100 disabled:opacity-50"
              required
            />
          </div>
        )}

        {/* Total Estimate */}
        {totalEstimate > 0 && (
          <div className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded-md flex justify-between items-center text-xs">
            <span className="text-zinc-500">Volume Estimado:</span>
            <span className="font-mono-nums font-semibold text-zinc-100">
              R$ {totalEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Feedbacks */}
        {error && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-md">{error}</div>}
        {message && <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 p-2.5 rounded-md">{message}</div>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !marketStatus.isOpen}
          className={`w-full py-2.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            !marketStatus.isOpen 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : side === 'buy' 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950' 
                : 'bg-red-600 hover:bg-red-500 text-zinc-100'
          } disabled:opacity-50`}
        >
          {loading 
            ? 'Processando...' 
            : !marketStatus.isOpen 
              ? `Mercado Fechado (${marketStatus.nextOpening})`
              : side === 'buy' 
                ? 'Enviar Ordem de Compra' 
                : 'Enviar Ordem de Venda'}
        </button>
      </form>
    </div>
  )
}
