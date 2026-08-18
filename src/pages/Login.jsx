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
        // Register Flow (Create Team & Sign Up User)
        if (!newTeamName.trim()) throw new Error('Por favor, informe o nome da nova equipe.')
        if (!name.trim()) throw new Error('Por favor, informe o seu nome completo.')

        // 1. Create the team first
        const { data: newTeam, error: newTeamError } = await supabase
          .from('teams')
          .insert({ name: newTeamName.trim() })
          .select()
          .single()

        if (newTeamError) {
          if (newTeamError.code === '23505') {
            throw new Error('Já existe uma equipe cadastrada com este nome.')
          }
          throw newTeamError
        }

        // 2. Sign up user in Supabase auth
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

        setSuccessMsg('Equipe e conta criadas com sucesso! Faça login abaixo para entrar.')
        setActiveTab('login')
        setNewTeamName('')
        setName('')
        setPassword('')
      } else {
        // Login Flow (Sign in with Email and Password)
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        navigate('/')
      }
    } catch (err) {
      console.error('Auth Error:', err)
      setError(err.message || 'Erro na autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-650/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Logo and Greeting */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
            app_carteira
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Simulador de Competições de Investimentos B3
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-450 hover:text-slate-300'
            }`}
          >
            Entrar na Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-450 hover:text-slate-300'
            }`}
          >
            Cadastrar Nova Equipe
          </button>
        </div>

        {/* Feedbacks */}
        {error && (
          <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl text-xs text-emerald-400 font-medium">
            {successMsg}
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {activeTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome da Equipe</label>
                <input
                  type="text"
                  placeholder="Ex: Equipe Tubarões"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Seu Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl font-bold text-sm transition-colors mt-2 disabled:opacity-50 select-none shadow-lg shadow-indigo-600/10"
          >
            {loading 
              ? 'Processando...' 
              : activeTab === 'register' 
                ? 'Criar Equipe e Registrar' 
                : 'Entrar na Plataforma'}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-500">
          Protegido por políticas de Row Level Security (RLS) do Supabase.
        </div>

      </div>
    </div>
  )
}
