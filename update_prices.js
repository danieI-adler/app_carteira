/* global process */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Credenciais do Supabase ausentes no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchQuote(symbol) {
  const yahooSymbol = `${symbol}.SA`
  const url1m = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1mo&interval=1d`
  
  try {
    const response = await fetch(url1m, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (response.status === 404) {
      console.warn(`Aviso: Ativo ${symbol} retornou 404. Deletando do banco...`)
      await supabase.from('assets').delete().eq('symbol', symbol)
      return null
    }

    if (!response.ok) {
      console.warn(`Aviso: Falha temporária ao obter cotação de ${symbol} (Status ${response.status})`)
      return null
    }
    
    const data = await response.json()
    const result = data.chart?.result?.[0]
    const meta = result?.meta
    const timestamps = result?.timestamp || []
    const quote = result?.indicators?.quote?.[0]
    
    const lastPrice = meta?.regularMarketPrice || null
    
    // Process 1M real historical points
    const points1m = []
    if (timestamps.length > 0 && quote?.close) {
      for (let i = 0; i < timestamps.length; i++) {
        const c = quote.close[i]
        if (c !== null && typeof c === 'number' && !isNaN(c) && c > 0) {
          const d = new Date(timestamps[i] * 1000)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          points1m.push({
            price: parseFloat(c.toFixed(2)),
            open: quote.open?.[i] ? parseFloat(quote.open[i].toFixed(2)) : parseFloat(c.toFixed(2)),
            high: quote.high?.[i] ? parseFloat(quote.high[i].toFixed(2)) : parseFloat(c.toFixed(2)),
            low: quote.low?.[i] ? parseFloat(quote.low[i].toFixed(2)) : parseFloat(c.toFixed(2)),
            label: `${day}/${month}`
          })
        }
      }
    }

    // Process 1W (last 6 daily points)
    const points1w = points1m.slice(-6)

    // Process open price
    let openPrice = lastPrice
    if (points1m.length > 0) {
      openPrice = points1m[points1m.length - 1].open || lastPrice
    }

    return { 
      symbol, 
      price: lastPrice, 
      openPrice,
      chartData: {
        '1m': points1m,
        '1w': points1w,
        '1d': points1w.slice(-2)
      }
    }
  } catch (e) {
    console.warn(`Erro ao consultar ${symbol}:`, e.message)
    return null
  }
}

async function executePendingOrders(priceMap) {
  console.log('Verificando ordens a mercado pendentes para liquidação com preço de abertura...')
  
  const { data: pendingOrders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .eq('order_type', 'market')

  if (ordersError) {
    console.error('Erro ao buscar ordens pendentes:', ordersError.message)
    return
  }

  if (!pendingOrders || pendingOrders.length === 0) {
    console.log('Nenhuma ordem a mercado pendente para executar.')
    return
  }

  console.log(`Encontradas ${pendingOrders.length} ordens pendentes para liquidação. Processando...`)

  for (const order of pendingOrders) {
    const assetPriceInfo = priceMap[order.asset_symbol]
    if (!assetPriceInfo) {
      console.warn(`Preço não encontrado para o ativo ${order.asset_symbol}. Pulando ordem ${order.id}.`)
      continue
    }

    const execPrice = assetPriceInfo.openPrice || assetPriceInfo.price
    if (!execPrice || execPrice <= 0) {
      console.warn(`Preço inválido para ${order.asset_symbol}. Pulando ordem ${order.id}.`)
      continue
    }

    const totalCost = order.quantity * execPrice

    try {
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .select('balance')
        .eq('id', order.team_id)
        .single()

      if (teamErr || !team) {
        console.error(`Equipe ${order.team_id} não encontrada para a ordem ${order.id}`)
        continue
      }

      if (order.side === 'buy') {
        if (team.balance < totalCost) {
          console.warn(`Saldo insuficiente para ordem ${order.id}. Cancelando...`)
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
          continue
        }

        await supabase
          .from('teams')
          .update({ balance: team.balance - totalCost })
          .eq('id', order.team_id)

        const { data: currentPos } = await supabase
          .from('portfolio_positions')
          .select('quantity, average_price')
          .eq('team_id', order.team_id)
          .eq('asset_symbol', order.asset_symbol)
          .eq('position_type', 'long')
          .single()

        if (currentPos) {
          const newQty = currentPos.quantity + order.quantity
          const newAvg = ((currentPos.quantity * currentPos.average_price) + totalCost) / newQty
          await supabase
            .from('portfolio_positions')
            .update({ quantity: newQty, average_price: newAvg, updated_at: new Date().toISOString() })
            .eq('team_id', order.team_id)
            .eq('asset_symbol', order.asset_symbol)
            .eq('position_type', 'long')
        } else {
          await supabase
            .from('portfolio_positions')
            .insert({
              team_id: order.team_id,
              asset_symbol: order.asset_symbol,
              quantity: order.quantity,
              average_price: execPrice,
              position_type: 'long'
            })
        }

        await supabase
          .from('transactions')
          .insert({
            team_id: order.team_id,
            asset_symbol: order.asset_symbol,
            quantity: order.quantity,
            price: execPrice,
            transaction_type: 'buy'
          })

        await supabase
          .from('orders')
          .update({
            status: 'executed',
            execution_price: execPrice,
            executed_at: new Date().toISOString()
          })
          .eq('id', order.id)

      } else if (order.side === 'sell') {
        const { data: currentPos } = await supabase
          .from('portfolio_positions')
          .select('quantity')
          .eq('team_id', order.team_id)
          .eq('asset_symbol', order.asset_symbol)
          .eq('position_type', 'long')
          .single()

        if (!currentPos || currentPos.quantity < order.quantity) {
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
          continue
        }

        await supabase
          .from('teams')
          .update({ balance: team.balance + totalCost })
          .eq('id', order.team_id)

        if (currentPos.quantity === order.quantity) {
          await supabase
            .from('portfolio_positions')
            .delete()
            .eq('team_id', order.team_id)
            .eq('asset_symbol', order.asset_symbol)
            .eq('position_type', 'long')
        } else {
          await supabase
            .from('portfolio_positions')
            .update({ quantity: currentPos.quantity - order.quantity, updated_at: new Date().toISOString() })
            .eq('team_id', order.team_id)
            .eq('asset_symbol', order.asset_symbol)
            .eq('position_type', 'long')
        }

        await supabase
          .from('transactions')
          .insert({
            team_id: order.team_id,
            asset_symbol: order.asset_symbol,
            quantity: order.quantity,
            price: execPrice,
            transaction_type: 'sell'
          })

        await supabase
          .from('orders')
          .update({
            status: 'executed',
            execution_price: execPrice,
            executed_at: new Date().toISOString()
          })
          .eq('id', order.id)
      }

    } catch (err) {
      console.error(`Erro ao processar ordem ${order.id}:`, err.message)
    }
  }
}

async function updatePrices() {
  console.log('Buscando lista de ativos no Supabase...')
  const { data: assets, error: fetchError } = await supabase
    .from('assets')
    .select('symbol')

  if (fetchError) {
    console.error('Erro ao buscar ativos do banco:', fetchError.message)
    process.exit(1)
  }

  if (!assets || assets.length === 0) {
    console.log('Nenhum ativo cadastrado para atualizar.')
    process.exit(0)
  }

  console.log(`Encontrados ${assets.length} ativos. Iniciando cotações diárias e séries históricas...`)

  const chunkSize = 10
  const results = []
  const priceMap = {}

  for (let i = 0; i < assets.length; i += chunkSize) {
    const chunk = assets.slice(i, i + chunkSize)
    const promises = chunk.map(asset => fetchQuote(asset.symbol))
    const chunkResults = await Promise.all(promises)
    
    for (const res of chunkResults.filter(Boolean)) {
      results.push(res)
      priceMap[res.symbol] = res
    }
    
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  console.log(`Cotações e séries obtidas: ${results.length} de ${assets.length}. Atualizando banco de dados...`)

  for (const quote of results) {
    if (quote.price) {
      const updatePayload = {
        last_price: quote.price,
        updated_at: new Date().toISOString()
      }
      
      // If chartData exists, attempt to update
      if (quote.chartData) {
        updatePayload.chart_data = quote.chartData
      }

      const { error: updateError } = await supabase
        .from('assets')
        .update(updatePayload)
        .eq('symbol', quote.symbol)

      if (updateError) {
        // Fallback without chart_data if column not yet created
        await supabase
          .from('assets')
          .update({ last_price: quote.price, updated_at: new Date().toISOString() })
          .eq('symbol', quote.symbol)
      }
    }
  }

  await executePendingOrders(priceMap)

  console.log('Ciclo diário concluído com sucesso.')
  process.exit(0)
}

updatePrices()
