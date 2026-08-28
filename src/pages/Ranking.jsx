import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export default function Ranking() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchRanking() {
      try {
        setLoading(true)
        const { data, error: dbError } = await supabase
          .from('teams')
          .select('id, name, net_worth, created_at')
          .order('net_worth', { ascending: false })

        if (dbError) throw dbError
        setTeams(data || [])
      } catch (err) {
        console.error('Error fetching ranking:', err)
        setError(err.message || 'Erro ao carregar classificação.')
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [])

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const top1 = teams[0]
  const top2 = teams[1]
  const top3 = teams[2]
  const initialCapital = 10000000.00

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Classificação</div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mt-0.5">Ranking Geral da Competição</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs">Carregando classificação...</div>
      ) : error ? (
        <div className="surface-card p-6 max-w-md mx-auto text-center border-red-900/40 text-red-400 text-xs">{error}</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs">Nenhuma equipe cadastrada.</div>
      ) : (
        <main className="space-y-6">
          
          {/* Top 3 Institutional Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* 2nd Place */}
            {top2 ? (
              <div className="surface-card p-4 flex flex-col justify-between space-y-3 md:order-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-nums font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                    #2
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">2º Lugar</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 truncate">{top2.name}</h3>
                  <div className="font-mono-nums text-base font-semibold text-zinc-100 mt-1">{formatBRL(top2.net_worth)}</div>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-[11px] font-mono-nums flex justify-between">
                  <span className="text-zinc-500">Rentabilidade:</span>
                  <span className={`font-semibold ${top2.net_worth - initialCapital >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {top2.net_worth - initialCapital >= 0 ? '+' : ''}{((top2.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : null}

            {/* 1st Place (Leader) */}
            {top1 ? (
              <div className="surface-card p-4 flex flex-col justify-between space-y-3 md:order-2 border-zinc-700 bg-[#16161a]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-nums font-bold text-zinc-950 bg-zinc-200 px-2 py-0.5 rounded">
                    #1 Líder
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">1º Lugar</span>
                </div>
                <div>
                  <h3 className="font-semibold text-base text-zinc-100 truncate">{top1.name}</h3>
                  <div className="font-mono-nums text-lg font-bold text-zinc-100 mt-1">{formatBRL(top1.net_worth)}</div>
                </div>
                <div className="pt-2 border-t border-zinc-700 text-[11px] font-mono-nums flex justify-between">
                  <span className="text-zinc-400">Rentabilidade:</span>
                  <span className={`font-bold ${top1.net_worth - initialCapital >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {top1.net_worth - initialCapital >= 0 ? '+' : ''}{((top1.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : null}

            {/* 3rd Place */}
            {top3 ? (
              <div className="surface-card p-4 flex flex-col justify-between space-y-3 md:order-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-nums font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                    #3
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">3º Lugar</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 truncate">{top3.name}</h3>
                  <div className="font-mono-nums text-base font-semibold text-zinc-100 mt-1">{formatBRL(top3.net_worth)}</div>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-[11px] font-mono-nums flex justify-between">
                  <span className="text-zinc-500">Rentabilidade:</span>
                  <span className={`font-semibold ${top3.net_worth - initialCapital >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {top3.net_worth - initialCapital >= 0 ? '+' : ''}{((top3.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : null}

          </div>

          {/* Full Table */}
          <div className="surface-card">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Tabela de Classificação</h2>
              <span className="text-xs text-zinc-500 font-mono-nums">{teams.length} equipes</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-[#0c0c0e]">
                    <th className="py-2.5 px-4 font-medium w-16 text-center">Posição</th>
                    <th className="py-2.5 px-4 font-medium">Equipe</th>
                    <th className="py-2.5 px-4 text-right font-medium min-w-[120px]">Patrimônio Líquido</th>
                    <th className="py-2.5 px-4 text-right font-medium min-w-[120px]">Lucro/Prejuízo</th>
                    <th className="py-2.5 px-4 text-right font-medium min-w-[100px]">Rentabilidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {teams.map((team, idx) => {
                    const position = idx + 1
                    const profit = team.net_worth - initialCapital
                    const yieldPercent = (profit / initialCapital) * 100

                    return (
                      <tr key={team.id} className="table-row-hover font-mono-nums">
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${position === 1 ? 'bg-zinc-200 text-zinc-950 font-bold' : 'text-zinc-400 bg-zinc-900 border border-zinc-800'}`}>
                            {position}º
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-100 font-sans">
                          {team.name}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-100 whitespace-nowrap">{formatBRL(team.net_worth)}</td>
                        <td className={`py-3 px-4 text-right whitespace-nowrap font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}{formatBRL(profit)}
                        </td>
                        <td className={`py-3 px-4 text-right whitespace-nowrap font-semibold ${yieldPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {yieldPercent >= 0 ? '+' : ''}{yieldPercent.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}
    </div>
  )
}
