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
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold text-white mb-2">Enviar Nova Ordem</h2>

      {/* Ativo */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Selecione o Ativo</label>
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {assets.map((a) => (
            <option key={a.symbol} value={a.symbol}>
              {a.symbol} - {a.name} (R$ {a.last_price.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Operação */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`py-2 rounded-lg font-semibold text-xs transition-colors border ${
            side === 'buy'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-350'
          }`}
        >
          Compra
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`py-2 rounded-lg font-semibold text-xs transition-colors border ${
            side === 'sell'
              ? 'bg-rose-950/40 text-rose-450 border-rose-900'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-350'
          }`}
        >
          Venda
        </button>
        <button
          type="button"
          onClick={() => setSide('short')}
          className={`py-2 rounded-lg font-semibold text-xs transition-colors border ${
            side === 'short'
              ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-350'
          }`}
        >
          Venda a Descoberto
        </button>
        <button
          type="button"
          onClick={() => setSide('cover')}
          className={`py-2 rounded-lg font-semibold text-xs transition-colors border ${
            side === 'cover'
              ? 'bg-amber-950/40 text-amber-400 border-amber-900'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-350'
          }`}
        >
          Cobrir Short
        </button>
      </div>

      {/* Tipo de Ordem */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOrderType('market')}
          className={`py-1.5 rounded-lg text-xs font-medium border ${
            orderType === 'market'
              ? 'bg-slate-700 text-white border-slate-600'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          A Mercado
        </button>
        <button
          type="button"
          onClick={() => setOrderType('limit')}
          className={`py-1.5 rounded-lg text-xs font-medium border ${
            orderType === 'limit'
              ? 'bg-slate-700 text-white border-slate-600'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Limitada
        </button>
      </div>

      {/* Quantidade */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Quantidade</label>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Ex: 100"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          required
        />
      </div>

      {/* Preço Limite */}
      {orderType === 'limit' && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Preço Limite (R$)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 35.50"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
      )}

      {/* Estimativas rápidas */}
      {selectedAsset && quantity && (
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 text-xs text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Preço de Referência:</span>
            <span className="text-slate-200">R$ {selectedAsset.last_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-slate-850 pt-1 mt-1">
            <span>Estimativa Total:</span>
            <span className="text-white">
              R$ {(parseFloat(quantity) * (orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedAsset.last_price)).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Notificações de Erro ou Sucesso */}
      {error && <div className="text-xs text-rose-450 bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-lg">{error}</div>}
      {message && <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 p-2.5 rounded-lg">{message}</div>}

      {/* Enviar */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processando...' : 'Enviar Ordem'}
      </button>
    </form>
  )
}
