/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export default function usePortfolio() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [positions, setPositions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPortfolioData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)

      // 1. Get profile to find team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      if (!profile?.team_id) {
        setTeam(null)
        setPositions([])
        setTransactions([])
        return
      }

      const teamId = profile.team_id

      // 2. Fetch Team stats
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError
      setTeam(teamData)

      // 3. Fetch Positions with Asset Details
      const { data: positionsData, error: positionsError } = await supabase
        .from('portfolio_positions')
        .select(`
          quantity,
          average_price,
          position_type,
          asset_symbol,
          assets (
            name,
            last_price,
            type
          )
        `)
        .eq('team_id', teamId)

      if (positionsError) throw positionsError
      setPositions(positionsData || [])

      // 4. Fetch Last 10 Transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError(err.message || 'Erro ao carregar dados do portfólio.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPortfolioData()
  }, [fetchPortfolioData])

  return {
    team,
    positions,
    transactions,
    loading,
    error,
    refetch: fetchPortfolioData,
  }
}
