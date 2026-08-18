/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function Admin() {
  const [teams, setTeams] = useState([])
  const [profiles, setProfiles] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 1. Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name')
      if (teamsError) throw teamsError
      setTeams(teamsData || [])

      // 2. Fetch Profiles with Team info
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          role,
          team_id,
          teams (
            name
          )
        `)
        .order('name')
      if (profilesError) throw profilesError
      setProfiles(profilesData || [])
    } catch (err) {
      console.error('Error fetching admin data:', err)
      alert('Erro ao carregar dados do painel: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreating(true)

    try {
      const { error } = await supabase
        .from('teams')
        .insert({ name: newTeamName.trim(), balance: 10000000.00 })

      if (error) throw error
      setNewTeamName('')
      alert('Equipe criada com sucesso!')
      fetchData()
    } catch (err) {
      alert('Erro ao criar equipe: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateUserTeam = async (profileId, teamId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team_id: teamId ? teamId : null })
        .eq('id', profileId)

      if (error) throw error
      alert('Equipe do usuário atualizada!')
      fetchData()
    } catch (err) {
      alert('Erro ao vincular usuário à equipe: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Painel do Administrador</h1>
          <p className="text-slate-400 mt-1">Configuração e controle operacional do app_carteira.</p>
        </div>
        <nav className="flex gap-4">
          <Link
            to="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            Ver Carteira
          </Link>
          <Link
            to="/mercado"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            Mercado
          </Link>
        </nav>
      </header>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando painel administrativo...</div>
      ) : (
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Team Form */}
          <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-white mb-4">Criar Nova Equipe</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome da Equipe</label>
                <input
                  type="text"
                  placeholder="Ex: Equipe Libra"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creating ? 'Criando...' : 'Salvar Equipe'}
              </button>
            </form>
          </section>

          {/* Users & Team Assignment List */}
          <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Vincular Usuários às Equipes</h2>
              <p className="text-xs text-slate-400 mt-1">Gerencie os participantes e defina a qual equipe pertencem.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2.5">Nome</th>
                    <th className="py-2.5">Função</th>
                    <th className="py-2.5">Equipe Atual</th>
                    <th className="py-2.5 text-right">Alterar Equipe</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-slate-800 hover:bg-slate-750/30">
                      <td className="py-3 text-slate-200 font-semibold">{profile.name}</td>
                      <td className="py-3 capitalize text-slate-450 text-xs">
                        {profile.role === 'admin' ? (
                          <span className="bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/30">
                            Admin
                          </span>
                        ) : (
                          'Participante'
                        )}
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {profile.teams?.name || <span className="text-slate-500 italic">Sem Equipe</span>}
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={profile.team_id || ''}
                          onChange={(e) => handleUpdateUserTeam(profile.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-350 focus:outline-none"
                        >
                          <option value="">-- Remover da Equipe --</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </main>
      )}
    </div>
  )
}
