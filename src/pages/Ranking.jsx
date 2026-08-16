import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Classificação Geral</h1>
          <p className="text-slate-400 mt-1">Veja a classificação e a rentabilidade acumulada de todas as equipes.</p>
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
          <Link
            to="/admin"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            Painel Admin
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6">Tabela de Classificação</h2>
          
          {loading ? (
            <div className="text-center py-12 text-slate-500">Carregando classificação...</div>
          ) : error ? (
            <div className="text-center py-12 text-rose-400">{error}</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Nenhuma equipe cadastrada até o momento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-3 w-16 text-center">Pos</th>
                    <th className="py-3">Equipe</th>
                    <th className="py-3 text-right">Patrimônio Líquido</th>
                    <th className="py-3 text-right">Lucro/Prejuízo Acumulado</th>
                    <th className="py-3 text-right">Rentabilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, idx) => {
                    const position = idx + 1
                    const initialCapital = 10000000.00
                    const profit = team.net_worth - initialCapital
                    const yieldPercent = (profit / initialCapital) * 100

                    // Style top 3 positions
                    let posBadge;
                    if (position === 1) posBadge = 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/35 font-bold'
                    else if (position === 2) posBadge = 'bg-slate-350/20 text-slate-300 border border-slate-300/35 font-bold'
                    else if (position === 3) posBadge = 'bg-amber-600/20 text-amber-500 border border-amber-600/35 font-bold'
                    else posBadge = 'text-slate-400 font-medium'

                    return (
                      <tr key={team.id} className="border-b border-slate-800 hover:bg-slate-750/30">
                        <td className="py-4 text-center">
                          <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center text-xs ${posBadge}`}>
                            {position}
                          </span>
                        </td>
                        <td className="py-4 font-semibold text-white">{team.name}</td>
                        <td className="py-4 text-right font-medium text-slate-200">
                          {formatBRL(team.net_worth)}
                        </td>
                        <td className={`py-4 text-right font-semibold ${profit >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                          {profit >= 0 ? '+' : ''}{formatBRL(profit)}
                        </td>
                        <td className={`py-4 text-right font-bold ${yieldPercent >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                          {yieldPercent >= 0 ? '+' : ''}{yieldPercent.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
