import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import SpotlightCard from '../components/ui/SpotlightCard'
import { Trophy, Medal, Crown } from 'lucide-react'

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
  const otherTeams = teams.slice(3)

  const initialCapital = 10000000.00

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
          <Trophy size={14} />
          <span>Competição B3</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Classificação Geral</h1>
        <p className="text-slate-400 text-xs mt-1">Ranking ao vivo baseado no Patrimônio Líquido consolidado.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Carregando posições da competição...</div>
      ) : error ? (
        <div className="text-center py-20 text-rose-450">{error}</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 text-slate-500">Nenhuma equipe registrada na competição.</div>
      ) : (
        <main className="space-y-12">
          
          {/* 3D PEDESTAL PODIUM */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
            
            {/* 2nd Place (Silver Pedestal) */}
            {top2 ? (
              <SpotlightCard 
                spotlightColor="rgba(148, 163, 184, 0.2)"
                className="p-6 text-center space-y-4 md:order-1 h-[250px] flex flex-col justify-between border-slate-700/60 bg-gradient-to-t from-slate-900/90 to-slate-900/40 relative"
              >
                <div className="flex justify-center -mt-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-400 text-slate-200 font-black flex items-center justify-center text-base shadow-xl shadow-slate-900">
                    <Medal size={20} className="text-slate-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">2º Colocado</span>
                  <h3 className="font-extrabold text-white text-lg truncate px-2">{top2.name}</h3>
                </div>
                <div className="space-y-1 pt-2 border-t border-white/5">
                  <span className="text-xl font-black text-white block">{formatBRL(top2.net_worth)}</span>
                  <span className={`text-xs font-bold ${top2.net_worth - initialCapital >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {top2.net_worth - initialCapital >= 0 ? '+' : ''}{((top2.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </SpotlightCard>
            ) : (
              <div className="hidden md:block md:order-1 h-[250px]"></div>
            )}

            {/* 1st Place (Gold Center Pedestal - Taller & Glowing) */}
            {top1 && (
              <SpotlightCard 
                spotlightColor="rgba(234, 179, 8, 0.25)"
                className="p-7 text-center space-y-4 md:order-2 h-[310px] flex flex-col justify-between border-yellow-500/40 bg-gradient-to-t from-yellow-950/30 via-slate-900/80 to-slate-900/50 shadow-2xl relative"
              >
                <div className="flex justify-center -mt-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-600 via-yellow-500 to-amber-300 text-slate-950 font-black flex items-center justify-center text-xl shadow-2xl shadow-yellow-500/30 border-2 border-white/40 animate-pulse">
                    <Crown size={28} className="text-slate-950" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest bg-yellow-950/60 px-3 py-1 rounded-full border border-yellow-500/30">
                    Líder da Competição
                  </span>
                  <h3 className="font-black text-white text-2xl truncate px-2 mt-1">{top1.name}</h3>
                </div>
                <div className="space-y-1.5 pt-3 border-t border-yellow-500/20">
                  <span className="text-2xl font-black text-white block">{formatBRL(top1.net_worth)}</span>
                  <span className={`text-sm font-black ${top1.net_worth - initialCapital >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {top1.net_worth - initialCapital >= 0 ? '+' : ''}{((top1.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </SpotlightCard>
            )}

            {/* 3rd Place (Bronze Pedestal) */}
            {top3 ? (
              <SpotlightCard 
                spotlightColor="rgba(217, 119, 6, 0.2)"
                className="p-6 text-center space-y-4 md:order-3 h-[230px] flex flex-col justify-between border-amber-800/60 bg-gradient-to-t from-slate-900/90 to-slate-900/40 relative"
              >
                <div className="flex justify-center -mt-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-amber-600 text-amber-500 font-black flex items-center justify-center text-base shadow-xl shadow-slate-900">
                    <Medal size={20} className="text-amber-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-500/90 font-bold uppercase tracking-widest">3º Colocado</span>
                  <h3 className="font-extrabold text-white text-base truncate px-2">{top3.name}</h3>
                </div>
                <div className="space-y-1 pt-2 border-t border-white/5">
                  <span className="text-lg font-black text-white block">{formatBRL(top3.net_worth)}</span>
                  <span className={`text-xs font-bold ${top3.net_worth - initialCapital >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {top3.net_worth - initialCapital >= 0 ? '+' : ''}{((top3.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </SpotlightCard>
            ) : (
              <div className="hidden md:block md:order-3 h-[230px]"></div>
            )}

          </section>

          {/* OTHER POSITIONS TABLE */}
          {otherTeams.length > 0 && (
            <SpotlightCard className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-bold text-white tracking-tight">Demais Participantes</h2>
                <span className="text-xs text-slate-500">{otherTeams.length} equipes</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6 w-16 text-center">Posição</th>
                      <th className="py-3 px-4 sm:px-6">Equipe</th>
                      <th className="py-3 px-4 sm:px-6 text-right min-w-[130px]">Patrimônio Líquido</th>
                      <th className="py-3 px-4 sm:px-6 text-right min-w-[130px]">Lucro/Prejuízo</th>
                      <th className="py-3 px-4 sm:px-6 text-right min-w-[110px]">Rentabilidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {otherTeams.map((team, idx) => {
                      const position = idx + 4
                      const profit = team.net_worth - initialCapital
                      const yieldPercent = (profit / initialCapital) * 100

                      return (
                        <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 sm:px-6 text-center">
                            <span className="w-7 h-7 rounded-lg bg-slate-950 border border-white/10 text-slate-400 font-bold text-xs inline-flex items-center justify-center">
                              {position}º
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-200">{team.name}</td>
                          <td className="py-3.5 px-4 sm:px-6 text-right font-medium text-slate-350 whitespace-nowrap">{formatBRL(team.net_worth)}</td>
                          <td className={`py-3.5 px-4 sm:px-6 text-right font-bold whitespace-nowrap ${profit >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                            {profit >= 0 ? '+' : ''}{formatBRL(profit)}
                          </td>
                          <td className={`py-3.5 px-4 sm:px-6 text-right font-bold whitespace-nowrap ${yieldPercent >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                            {yieldPercent >= 0 ? '+' : ''}{yieldPercent.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          )}

        </main>
      )}
    </div>
  )
}
