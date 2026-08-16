import { useState } from 'react'
import { isSupabaseConfigured } from '../../services/supabase'

export default function DbConfigModal() {
  const [url, setUrl] = useState(localStorage.getItem('supabase_url') || '')
  const [anonKey, setAnonKey] = useState(localStorage.getItem('supabase_anon_key') || '')
  const [isOpen, setIsOpen] = useState(!isSupabaseConfigured())

  const handleSave = (e) => {
    e.preventDefault()
    if (!url.trim() || !anonKey.trim()) {
      alert('Por favor, preencha ambos os campos.')
      return
    }

    localStorage.setItem('supabase_url', url.trim())
    localStorage.setItem('supabase_anon_key', anonKey.trim())
    
    // Reload to re-initialize supabase client
    window.location.reload()
  }

  const handleReset = () => {
    if (window.confirm('Deseja realmente limpar as configurações de banco de dados locais?')) {
      localStorage.removeItem('supabase_url')
      localStorage.removeItem('supabase_anon_key')
      window.location.reload()
    }
  }

  if (!isOpen) {
    return (
      <div className="bg-slate-900 border-b border-slate-800 py-2 px-6 flex justify-between items-center text-xs text-slate-400">
        <span>Conectado ao seu banco de dados Supabase privado.</span>
        <button
          onClick={() => setIsOpen(true)}
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Editar Configurações de Banco
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Configurar Banco de Dados Supabase</h2>
          <p className="text-xs text-slate-400 mt-1">
            Insira os dados da sua instância para carregar os ativos e fazer o site funcionar.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Supabase URL</label>
            <input
              type="url"
              placeholder="https://xxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Supabase Anon Key</label>
            <textarea
              rows="3"
              placeholder="eyJhbGciOi..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Salvar e Conectar
            </button>
            {isSupabaseConfigured() && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {isSupabaseConfigured() && (
          <div className="text-center pt-2">
            <button
              onClick={handleReset}
              className="text-[10px] text-rose-400 hover:text-rose-350"
            >
              Limpar dados salvos (Desconectar)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
