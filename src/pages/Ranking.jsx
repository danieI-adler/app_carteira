import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export default function Ranking() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { profile } = useAuth()

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

  // Split into Top 3 and Others
  const top1 = teams[0]
  const top2 = teams[1]
  const top3 = teams[2]
  const otherTeams = teams.slice(3)

  const initialCapital = 10000000.00

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/5 shadow-2xl relative z-10">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Classificação da Competição</span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Leaderboard</h1>
          <p className="text-slate-400 text-xs mt-1">Acompanhe a rentabilidade e o patrimônio acumulado de todas as equipes.</p>
        </div>
        <nav className="flex gap-2">
          <Link
            to="/"
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Ver Carteira
          </Link>
          <Link
            to="/mercado"
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Mercado
          </Link>
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-indigo-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Painel Admin
            </Link>
          )}
        </nav>
      </header>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Carregando classificação geral...</div>
      ) : error ? (
        <div className="text-center py-16 text-rose-450">{error}</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Nenhuma equipe registrada na competição.</div>
      ) : (
        <main className="space-y-12 relative z-10">
          
          {/* TOP 3 PODIUM */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
            
            {/* 2nd Place */}
            {top2 ? (
              <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl text-center space-y-4 md:order-1 h-[240px] flex flex-col justify-end relative group hover:border-indigo-500/20 transition-all">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-400/20 border border-slate-300 text-slate-200 font-black flex items-center justify-center text-sm shadow-md">2</div>
                <h3 className="font-extrabold text-white text-lg truncate px-2">{top2.name}</h3>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Patrimônio Líquido</span>
                  <span className="text-xl font-black text-slate-100 block">{formatBRL(top2.net_worth)}</span>
                  <span className={`text-xs font-bold ${top2.net_worth - initialCapital >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                    {top2.net_worth - initialCapital >= 0 ? '+' : ''}{((top2.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="hidden md:block md:order-1 h-[240px]"></div>
            )}

            {/* 1st Place (Center & Taller) */}
            {top1 && (
              <div className="glass-card rounded-2xl p-8 border border-indigo-500/20 shadow-2xl text-center space-y-4 md:order-2 h-[290px] flex flex-col justify-end relative bg-gradient-to-b from-indigo-950/20 via-slate-900/40 to-slate-900/60 hover:border-indigo-500/35 transition-all">
                {/* Glowing neon crown */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-yellow-500/10 border-2 border-yellow-500 text-yellow-500 font-black flex items-center justify-center text-xl shadow-lg shadow-yellow-500/20">👑</div>
                <h3 className="font-black text-white text-2xl truncate px-2">{top1.name}</h3>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest block">Líder do Ranking</span>
                  <span className="text-2xl font-black text-white block">{formatBRL(top1.net_worth)}</span>
                  <span className={`text-sm font-bold ${top1.net_worth - initialCapital >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                    {top1.net_worth - initialCapital >= 0 ? '+' : ''}{((top1.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 ? (
              <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl text-center space-y-4 md:order-3 h-[210px] flex flex-col justify-end relative group hover:border-indigo-500/20 transition-all">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-700/20 border border-amber-600 text-amber-500 font-black flex items-center justify-center text-sm shadow-md">3</div>
                <h3 className="font-extrabold text-white text-md truncate px-2">{top3.name}</h3>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Patrimônio Líquido</span>
                  <span className="text-lg font-black text-slate-200 block">{formatBRL(top3.net_worth)}</span>
                  <span className={`text-xs font-bold ${top3.net_worth - initialCapital >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                    {top3.net_worth - initialCapital >= 0 ? '+' : ''}{((top3.net_worth - initialCapital) / initialCapital * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="hidden md:block md:order-3 h-[210px]"></div>
            )}

          </section>

          {/* OTHER POSITIONS TABLE */}
          {otherTeams.length > 0 && (
            <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-3">Demais Classificações</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-450 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 w-16 text-center">Posição</th>
                      <th className="py-3">Equipe</th>
                      <th className="py-3 text-right">Patrimônio Líquido</th>
                      <th className="py-3 text-right">Retorno Total</th>
                      <th className="py-3 text-right">Rentabilidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {otherTeams.map((team, idx) => {
                      const position = idx + 4
                      const profit = team.net_worth - initialCapital
                      const yieldPercent = (profit / initialCapital) * 100

                      return (
                        <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 text-center">
                            <span className="text-slate-400 font-semibold">{position}º</span>
                          </td>
                          <td className="py-3.5 font-bold text-slate-200">{team.name}</td>
                          <td className="py-3.5 text-right font-medium text-slate-350">{formatBRL(team.net_worth)}</td>
                          <td className={`py-3.5 text-right font-bold ${profit >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                            {profit >= 0 ? '+' : ''}{formatBRL(profit)}
                          </td>
                          <td className={`py-3.5 text-right font-bold ${yieldPercent >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                            {yieldPercent >= 0 ? '+' : ''}{yieldPercent.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </main>
      )}
    </div>
  )
}
