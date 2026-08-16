import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [createTeamMode, setCreateTeamMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTeams() {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name')
      if (!error && data) {
        setTeams(data)
        if (data.length > 0) setSelectedTeamId(data[0].id)
      }
    }
    fetchTeams()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isRegister) {
        let teamId = selectedTeamId

        // 1. Create team if in createTeamMode
        if (createTeamMode) {
          if (!newTeamName.trim()) throw new Error('Por favor, informe o nome da nova equipe.')
          const { data: newTeam, error: newTeamError } = await supabase
            .from('teams')
            .insert({ name: newTeamName.trim() })
            .select()
            .single()

          if (newTeamError) throw newTeamError
          teamId = newTeam.id
        }

        if (!teamId && !createTeamMode) {
          throw new Error('Selecione ou crie uma equipe para se registrar.')
        }

        // 2. Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        })

        if (authError) throw authError
        if (!authData?.user) throw new Error('Erro ao criar conta de usuário.')

        // 3. Update profile with team_id (profile is created automatically by database trigger)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name,
            team_id: teamId,
          })
          .eq('id', authData.user.id)

        if (profileError) throw profileError
        alert('Cadastro realizado com sucesso!')
      } else {
        // Sign in
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
      }

      navigate('/')
    } catch (err) {
      console.error('Auth Error:', err)
      setError(err.message || 'Erro na operação de autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">app_carteira</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister ? 'Crie sua conta para entrar na competição' : 'Faça login para gerenciar sua carteira'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-lg text-xs text-rose-450">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {isRegister && (
            <div className="border-t border-slate-700/50 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-350">Vincular-se a uma Equipe</span>
                <button
                  type="button"
                  onClick={() => setCreateTeamMode(!createTeamMode)}
                  className="text-indigo-405 font-medium hover:underline"
                >
                  {createTeamMode ? 'Selecionar Equipe' : 'Criar Nova Equipe'}
                </button>
              </div>

              {createTeamMode ? (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Nova Equipe</label>
                  <input
                    type="text"
                    placeholder="Nome da equipe"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    required={createTeamMode}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Selecione a Equipe</label>
                  {teams.length === 0 ? (
                    <p className="text-xs text-amber-500 bg-amber-950/20 p-2 rounded border border-amber-900/40">
                      Nenhuma equipe cadastrada. Por favor, selecione "Criar Nova Equipe".
                    </p>
                  ) : (
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isRegister ? 'Cadastrar e Entrar' : 'Entrar'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-700/50">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-indigo-400 hover:text-indigo-350 font-medium"
          >
            {isRegister ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  )
}
