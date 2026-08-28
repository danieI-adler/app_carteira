import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'

export default function OrderForm({ onCreateOrder }) {
  const [assets, setAssets] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [side, setSide] = useState('buy') // buy, sell, short, cover
  const [orderType, setOrderType] = useState('market') // market, limit
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAssets() {
      const { data, error } = await supabase
        .from('assets')
        .select('symbol, name, last_price')
        .order('symbol')
      if (!error && data) {
        setAssets(data)
        if (data.length > 0) setSelectedSymbol(data[0].symbol)
      }
    }
    fetchAssets()
  }, [])

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol)

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

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
      <h2 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-3">Painel de Ordens</h2>

      {/* Ativo */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Selecionar Ativo</label>
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-3.5 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        >
          {assets.map((a) => (
            <option key={a.symbol} value={a.symbol} className="bg-slate-900 text-slate-200">
              {a.symbol} - R$ {a.last_price.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {/* Operação */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Tipo de Operação</label>
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              side === 'buy'
                ? 'bg-emerald-950/65 text-emerald-400 border border-emerald-900/30'
                : 'text-slate-450 hover:text-slate-250'
            }`}
          >
            Compra
          </button>
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              side === 'sell'
                ? 'bg-rose-950/65 text-rose-450 border border-rose-900/30'
                : 'text-slate-450 hover:text-slate-250'
            }`}
          >
            Venda
          </button>
          <button
            type="button"
            onClick={() => setSide('short')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              side === 'short'
                ? 'bg-indigo-950/65 text-indigo-450 border border-indigo-900/30'
                : 'text-slate-450 hover:text-slate-250'
            }`}
          >
            Aluguel (Short)
          </button>
          <button
            type="button"
            onClick={() => setSide('cover')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              side === 'cover'
                ? 'bg-amber-950/65 text-amber-400 border border-amber-900/30'
                : 'text-slate-450 hover:text-slate-250'
            }`}
          >
            Cobrir
          </button>
        </div>
      </div>

      {/* Tipo de Ordem */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Execução</label>
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'market'
                ? 'bg-slate-800 text-white shadow-sm border border-white/5'
                : 'text-slate-450 hover:text-slate-250'
            }`}
          >
            A Mercado
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'limit'
                ? 'bg-slate-800 text-white shadow-sm border border-white/5'
                : 'text-slate-450 hover:text-slate-250'
            }`}
          >
            Limitada
          </button>
        </div>
      </div>

      {/* Quantidade */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Quantidade</label>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Ex: 100"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-650"
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
            placeholder="Ex: 35.50"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-650"
            required
          />
        </div>
      )}

      {/* Estimativas rápidas */}
      {selectedAsset && quantity && (
        <div className="bg-slate-950/55 p-4 rounded-xl border border-white/5 text-xs text-slate-400 space-y-2">
          <div className="flex justify-between items-center">
            <span>Preço Unitário:</span>
            <span className="text-slate-200 font-medium">R$ {selectedAsset.last_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-bold border-t border-white/5 pt-2 mt-2">
            <span>Volume Estimado:</span>
            <span className="text-white text-sm">
              R$ {(parseFloat(quantity) * (orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedAsset.last_price)).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Notificações de Erro ou Sucesso */}
      {error && <div className="text-xs text-rose-450 bg-rose-950/30 border border-rose-900/30 p-3 rounded-xl">{error}</div>}
      {message && <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 p-3 rounded-xl">{message}</div>}

      {/* Enviar */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 btn-neon text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? 'Processando...' : 'Enviar Ordem ao Mercado'}
      </button>
    </form>
  )
}
