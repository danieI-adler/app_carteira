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
    <div className="min-h-screen text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-card rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6 relative z-10 border border-white/5">
        
        {/* Logo and Greeting */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            app_carteira
          </h1>
          <p className="text-xs text-slate-400">
            Simulador de Competições de Investimentos B3
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-slate-800/80 text-white border border-white/5 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
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
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-slate-800/80 text-white border border-white/5 shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cadastrar Nova Equipe
          </button>
        </div>

        {/* Feedbacks */}
        {error && (
          <div className="bg-rose-950/30 border border-rose-900/30 p-3.5 rounded-xl text-xs text-rose-450 font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 p-3.5 rounded-xl text-xs text-emerald-400 font-medium">
            {successMsg}
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {activeTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Nome da Equipe</label>
                <input
                  type="text"
                  placeholder="Ex: Equipe Tubarões"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-650"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Seu Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-650"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">E-mail</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-650"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-650"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-neon text-white rounded-xl font-bold text-sm transition-all mt-3 disabled:opacity-50 select-none cursor-pointer"
          >
            {loading 
              ? 'Processando...' 
              : activeTab === 'register' 
                ? 'Criar Equipe e Registrar' 
                : 'Entrar na Plataforma'}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-550">
          Protegido por políticas de segurança RLS (Row Level Security).
        </div>

      </div>
    </div>
  )
}
