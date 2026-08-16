/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export default function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [teamId, setTeamId] = useState(null)

  const getTeamId = useCallback(async () => {
    if (!user) return null
    if (teamId) return teamId

    const { data, error } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching team id:', error)
      return null
    }

    setTeamId(data?.team_id)
    return data?.team_id
  }, [user, teamId])

  const fetchOrders = useCallback(async () => {
    const activeTeamId = await getTeamId()
    if (!activeTeamId) {
      setOrders([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('team_id', activeTeamId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Erro ao carregar ordens.')
    } finally {
      setLoading(false)
    }
  }, [getTeamId])

  const createOrder = async ({ assetSymbol, quantity, orderType, side, limitPrice }) => {
    const activeTeamId = await getTeamId()
    if (!activeTeamId) throw new Error('Usuário sem equipe associada.')

    try {
      setError(null)
      const { data, error } = await supabase
        .from('orders')
        .insert({
          team_id: activeTeamId,
          user_id: user.id,
          asset_symbol: assetSymbol,
          quantity,
          order_type: orderType,
          side,
          limit_price: limitPrice,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      
      // Update local orders state
      setOrders((prev) => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error creating order:', err)
      throw err
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      )
      return data
    } catch (err) {
      console.error('Error cancelling order:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    createOrder,
    cancelOrder,
    refetch: fetchOrders,
  }
}
