import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (activeTab === 'register') {
        if (!newTeamName.trim()) throw new Error('Informe o nome da equipe.')
        if (!name.trim()) throw new Error('Informe o seu nome completo.')

        const { data: newTeam, error: newTeamError } = await supabase
          .from('teams')
          .insert({ name: newTeamName.trim() })
          .select()
          .single()

        if (newTeamError) {
          if (newTeamError.code === '23505') {
            throw new Error('Já existe uma equipe com este nome.')
          }
          throw newTeamError
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              name: name.trim(),
              team_id: newTeam.id
            },
          },
        })

        if (authError) throw authError
        if (!authData?.user) throw new Error('Falha ao registrar usuário.')

        setSuccessMsg('Equipe e conta criadas. Efetue o login para acessar.')
        setActiveTab('login')
        setNewTeamName('')
        setName('')
        setPassword('')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Erro na autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm surface-card p-6 sm:p-8 space-y-6">
        
        {/* Brand */}
        <div className="space-y-1 text-center">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-100 mx-auto mb-3">
            C
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            app_carteira
          </h1>
          <p className="text-xs text-zinc-500">Gestão e Simulação de Portfólios</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#0c0c0e] border border-zinc-800 rounded-md">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Cadastrar Equipe
          </button>
        </div>

        {/* Feedbacks */}
        {error && (
          <div className="bg-red-950/40 border border-red-900/50 p-3 rounded-md text-xs text-red-300 font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-900/50 p-3 rounded-md text-xs text-emerald-300 font-medium">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {activeTab === 'register' && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-400">Nome da Equipe</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full input-institutional px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-400">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input-institutional px-3 py-2 text-xs"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-institutional px-3 py-2 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-institutional px-3 py-2 text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 btn-primary text-xs mt-2 disabled:opacity-50 select-none cursor-pointer"
          >
            {loading 
              ? 'Processando...' 
              : activeTab === 'register' 
                ? 'Criar Equipe' 
                : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}
