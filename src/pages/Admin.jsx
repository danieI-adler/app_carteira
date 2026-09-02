/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
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
      
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name')
      if (teamsError) throw teamsError
      setTeams(teamsData || [])

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
        .insert({ name: newTeamName.trim(), balance: 100000000.00 })

      if (error) throw error
      setNewTeamName('')
      alert('Equipe criada com sucesso.')
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
      alert('Equipe atualizada com sucesso.')
      fetchData()
    } catch (err) {
      alert('Erro ao vincular equipe: ' + err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Controle do Sistema</div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-0.5">Painel Administrativo</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs">Carregando painel...</div>
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create Team */}
          <div className="surface-card p-5 h-fit space-y-4">
            <h2 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-3">Criar Equipe</h2>
            <form onSubmit={handleCreateTeam} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-400">Nome da Equipe</label>
                <input
                  type="text"
                  placeholder="Nome oficial..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full input-institutional px-3 py-2 text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 btn-primary text-xs cursor-pointer disabled:opacity-50"
              >
                {creating ? 'Processando...' : 'Cadastrar Equipe'}
              </button>
            </form>
          </div>

          {/* User Assignments */}
          <div className="surface-card lg:col-span-2">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Gerenciamento de Participantes</h2>
              <span className="text-xs text-zinc-500 font-mono-nums">{profiles.length} usuários</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e]">
                    <th className="py-2.5 px-4 font-medium">Nome</th>
                    <th className="py-2.5 px-4 font-medium">Permissão</th>
                    <th className="py-2.5 px-4 font-medium">Equipe Atual</th>
                    <th className="py-2.5 px-4 text-right font-medium">Alterar Equipe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="table-row-hover">
                      <td className="py-3 px-4 font-semibold text-zinc-100">{profile.name}</td>
                      <td className="py-3 px-4 text-xs font-sans">
                        {profile.role === 'admin' ? (
                          <span className="bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                            Admin
                          </span>
                        ) : (
                          <span className="text-zinc-500">Usuário</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {profile.teams?.name || <span className="text-zinc-600 italic">Sem Equipe</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={profile.team_id || ''}
                          onChange={(e) => handleUpdateUserTeam(profile.id, e.target.value)}
                          className="input-institutional px-2.5 py-1 text-xs"
                        >
                          <option value="" className="bg-[#111114] text-zinc-400">-- Sem Equipe --</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id} className="bg-[#111114] text-zinc-200">
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
          </div>

        </main>
      )}
    </div>
  )
}
