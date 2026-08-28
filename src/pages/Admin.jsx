/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { Shield } from 'lucide-react'

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-2xl relative z-10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
          <Shield size={16} />
          <span>Painel Operacional</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Administração</h1>
        <p className="text-slate-400 text-xs mt-1">Configuração, gerenciamento de equipes e usuários.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Carregando painel administrativo...</div>
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* Create Team Form */}
          <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl h-fit space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-3">Criar Nova Equipe</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 pl-1">Nome da Equipe</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 btn-neon text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                {creating ? 'Criando...' : 'Salvar Equipe'}
              </button>
            </form>
          </section>

          {/* Users & Team Assignment List */}
          <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Vincular Usuários</h2>
              <p className="text-xs text-slate-400 mt-1">Gerencie os participantes e defina a qual equipe pertencem.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Nome</th>
                    <th className="py-3 px-4 sm:px-6">Função</th>
                    <th className="py-3 px-4 sm:px-6">Equipe Atual</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Alterar Equipe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-slate-200 font-bold">{profile.name}</td>
                      <td className="py-3.5 px-4 sm:px-6 capitalize text-xs">
                        {profile.role === 'admin' ? (
                          <span className="bg-indigo-950/40 text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-900/30 font-black uppercase text-[10px]">
                            Admin
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Participante</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-300 font-bold text-xs">
                        {profile.teams?.name || <span className="text-slate-550 italic font-normal">Sem Equipe</span>}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <select
                          value={profile.team_id || ''}
                          onChange={(e) => handleUpdateUserTeam(profile.id, e.target.value)}
                          className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-350 focus:outline-none"
                        >
                          <option value="" className="bg-slate-900 text-slate-300">-- Sem Equipe --</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id} className="bg-slate-900 text-slate-300">
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
