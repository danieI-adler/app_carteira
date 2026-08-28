/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import usePortfolio from '../../hooks/usePortfolio'
import SpotlightCard from '../ui/SpotlightCard'
import { ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react'

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

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError('A quantidade deve ser maior que zero.')
      return
    }

    const price = orderType === 'limit' ? parseFloat(limitPrice) : null
    if (orderType === 'limit' && (isNaN(price) || price <= 0)) {
      setError('O preço limite deve ser maior que zero.')
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
      setMessage('Ordem enviada com sucesso!')
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
    <SpotlightCard className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Painel de Ordens</h2>
        </div>
        {selectedAsset && (
          <span className="text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40">
            R$ {selectedAsset.last_price.toFixed(2)}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ativo */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Ativo para Negociação</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol} className="bg-slate-900 text-slate-200">
                {a.symbol} — R$ {a.last_price.toFixed(2)} ({a.name})
              </option>
            ))}
          </select>
        </div>

        {/* Operação (Tabs Modernas) */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Operação</label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                side === 'buy'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight size={14} />
              <span>Compra</span>
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                side === 'sell'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft size={14} />
              <span>Venda</span>
            </button>
            <button
              type="button"
              onClick={() => setSide('short')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                side === 'short'
                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Short
            </button>
            <button
              type="button"
              onClick={() => setSide('cover')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                side === 'cover'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Cobrir
            </button>
          </div>
        </div>

        {/* Tipo de Execução */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Tipo de Ordem</label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setOrderType('market')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderType === 'market'
                  ? 'bg-slate-800 text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              A Mercado
            </button>
            <button
              type="button"
              onClick={() => setOrderType('limit')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderType === 'limit'
                  ? 'bg-slate-800 text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Limitada
            </button>
          </div>
        </div>

        {/* Quantidade & Quick Percent Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5 pl-1 pr-1">
            <label className="text-xs font-medium text-slate-400">Quantidade</label>
            {/* Quick % Chips */}
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="chip-preset px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 cursor-pointer"
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
            placeholder="Qtd de ações..."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-600"
            required
          />
        </div>

        {/* Preço Limite */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Preço Limite (R$)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="R$ 0,00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-600"
              required
            />
          </div>
        )}

        {/* Live Estimate Card */}
        {totalEstimate > 0 && (
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/5 text-xs text-slate-400 space-y-1.5">
            <div className="flex justify-between items-center">
              <span>Volume Total:</span>
              <span className="text-white font-black text-sm">
                R$ {totalEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Feedbacks */}
        {error && <div className="text-xs text-rose-450 bg-rose-950/30 border border-rose-900/30 p-3 rounded-xl font-medium">{error}</div>}
        {message && <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 p-3 rounded-xl font-medium">{message}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 btn-neon text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Executando...' : side === 'buy' ? 'Confirmar Compra' : 'Confirmar Ordem'}
        </button>
      </form>
    </SpotlightCard>
  )
}
