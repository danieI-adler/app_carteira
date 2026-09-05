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
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }

  try {
    // 1. Fetch 1M daily series
    const url1m = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1mo&interval=1d`
    const res1m = await fetch(url1m, { headers })
    
    if (res1m.status === 404) {
      console.warn(`Aviso: Ativo ${symbol} retornou 404. Deletando do banco...`)
      await supabase.from('assets').delete().eq('symbol', symbol)
      return null
    }

    if (!res1m.ok) {
      console.warn(`Aviso: Falha ao obter cotação de ${symbol} (Status ${res1m.status})`)
      return null
    }

    const data1m = await res1m.json()
    const result1m = data1m.chart?.result?.[0]
    const meta = result1m?.meta
    const timestamps1m = result1m?.timestamp || []
    const quote1m = result1m?.indicators?.quote?.[0]
    const lastPrice = meta?.regularMarketPrice || null

    const points1m = []
    if (timestamps1m.length > 0 && quote1m?.close) {
      for (let i = 0; i < timestamps1m.length; i++) {
        let c = quote1m.close[i]
        // If the latest point is null, use the regularMarketPrice (currentPrice)
        if ((c === null || typeof c !== 'number' || isNaN(c)) && i === timestamps1m.length - 1 && lastPrice) {
          c = lastPrice
        }
        if (c !== null && typeof c === 'number' && !isNaN(c) && c > 0) {
          const d = new Date(timestamps1m[i] * 1000)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const isLast = i === timestamps1m.length - 1
          points1m.push({
            price: parseFloat(c.toFixed(2)),
            open: quote1m.open?.[i] ? parseFloat(quote1m.open[i].toFixed(2)) : parseFloat(c.toFixed(2)),
            high: quote1m.high?.[i] ? parseFloat(quote1m.high[i].toFixed(2)) : parseFloat(c.toFixed(2)),
            low: quote1m.low?.[i] ? parseFloat(quote1m.low[i].toFixed(2)) : parseFloat(c.toFixed(2)),
            label: isLast ? 'Atual' : `${day}/${month}`
          })
        }
      }
    }

    // 2. Fetch 1D real intraday 15-minute series
    let points1d = []
    try {
      const url1d = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=15m`
      const res1d = await fetch(url1d, { headers })
      if (res1d.ok) {
        const data1d = await res1d.json()
        const result1d = data1d.chart?.result?.[0]
        const timestamps1d = result1d?.timestamp || []
        const quote1d = result1d?.indicators?.quote?.[0]

        if (timestamps1d.length > 0 && quote1d?.close) {
          for (let i = 0; i < timestamps1d.length; i++) {
            let c = quote1d.close[i]
            if ((c === null || typeof c !== 'number' || isNaN(c)) && i === timestamps1d.length - 1 && lastPrice) {
              c = lastPrice
            }
            if (c !== null && typeof c === 'number' && !isNaN(c) && c > 0) {
              const d = new Date(timestamps1d[i] * 1000)
              const hours = String(d.getHours()).padStart(2, '0')
              const mins = String(d.getMinutes()).padStart(2, '0')
              const isLast = i === timestamps1d.length - 1
              points1d.push({
                price: parseFloat(c.toFixed(2)),
                open: quote1d.open?.[i] ? parseFloat(quote1d.open[i].toFixed(2)) : parseFloat(c.toFixed(2)),
                high: quote1d.high?.[i] ? parseFloat(quote1d.high[i].toFixed(2)) : parseFloat(c.toFixed(2)),
                low: quote1d.low?.[i] ? parseFloat(quote1d.low[i].toFixed(2)) : parseFloat(c.toFixed(2)),
                label: isLast ? 'Atual' : `${hours}:${mins}`
              })
            }
          }
        }
      }
    } catch {
      // Ignore intraday failure
    }

    // 3. Fetch 1W real 5-day hourly series
    let points1w = []
    try {
      const url1w = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=5d&interval=60m`
      const res1w = await fetch(url1w, { headers })
      if (res1w.ok) {
        const data1w = await res1w.json()
        const result1w = data1w.chart?.result?.[0]
        const timestamps1w = result1w?.timestamp || []
        const quote1w = result1w?.indicators?.quote?.[0]

        if (timestamps1w.length > 0 && quote1w?.close) {
          for (let i = 0; i < timestamps1w.length; i++) {
            let c = quote1w.close[i]
            if ((c === null || typeof c !== 'number' || isNaN(c)) && i === timestamps1w.length - 1 && lastPrice) {
              c = lastPrice
            }
            if (c !== null && typeof c === 'number' && !isNaN(c) && c > 0) {
              const d = new Date(timestamps1w[i] * 1000)
              const day = String(d.getDate()).padStart(2, '0')
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const hours = String(d.getHours()).padStart(2, '0')
              const isLast = i === timestamps1w.length - 1
              points1w.push({
                price: parseFloat(c.toFixed(2)),
                open: quote1w.open?.[i] ? parseFloat(quote1w.open[i].toFixed(2)) : parseFloat(c.toFixed(2)),
                high: quote1w.high?.[i] ? parseFloat(quote1w.high[i].toFixed(2)) : parseFloat(c.toFixed(2)),
                low: quote1w.low?.[i] ? parseFloat(quote1w.low[i].toFixed(2)) : parseFloat(c.toFixed(2)),
                label: isLast ? 'Atual' : `${day}/${month} ${hours}h`
              })
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    // Fallbacks if 1D or 1W were empty (e.g. market holiday)
    if (points1w.length === 0) {
      points1w = points1m.slice(-6)
    }
    if (points1d.length === 0) {
      points1d = points1w.slice(-5)
    }

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
        '1d': points1d
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

async function autoRebalanceLibra(priceMap) {
  console.log('\n--- AUTOMAÇÃO DO ROBÔ LIBRA (XGBOOST 100% EQUITY) ---')
  
  // 1. Buscar a equipe Libra
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('*')
    .ilike('name', '%libra%')
    .single()

  if (teamErr || !team) {
    console.log('Equipe Libra não cadastrada no Supabase. Pulando rebalanceamento automático.')
    return
  }

  // 2. Buscar posições atuais de custódia
  const { data: positions } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('team_id', team.id)
    .eq('position_type', 'long')

  const custodiaMap = {}
  let totalEquityValue = 0

  if (positions && positions.length > 0) {
    for (const pos of positions) {
      const pInfo = priceMap[pos.asset_symbol]
      const currPrice = pInfo?.price || pos.average_price || 30.00
      const posVal = pos.quantity * currPrice
      totalEquityValue += posVal
      custodiaMap[pos.asset_symbol] = {
        quantity: pos.quantity,
        average_price: pos.average_price,
        current_price: currPrice,
        value: posVal
      }
    }
  }

  const cashBalance = parseFloat(team.balance || 0)
  const totalNetWorth = cashBalance + totalEquityValue

  // Atualizar patrimônio líquido da equipe Libra no banco
  await supabase
    .from('teams')
    .update({ net_worth: totalNetWorth })
    .eq('id', team.id)

  console.log(`Equipe Libra: Patrimônio R$ ${totalNetWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Caixa: R$ ${cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`)

  // 99% em Ações com Pesos Dinâmicos do XGBoost + 1% Caixa Livre Obrigatório para Oscilação de Mercado
  const CASH_BUFFER_PCT = 0.01
  const allocatableEquity = totalNetWorth * (1.0 - CASH_BUFFER_PCT)

  const dynamicPortfolio = [
    { symbol: 'BRAP4', weight: 0.3605 }, // 35.69% da carteira total
    { symbol: 'ALUP11', weight: 0.3439 }, // 34.05% da carteira total
    { symbol: 'EQTL3', weight: 0.1180 },  // 11.68% da carteira total
    { symbol: 'CMIG4', weight: 0.0951 },  // 9.42% da carteira total
    { symbol: 'SBSP3', weight: 0.0824 },  // 8.16% da carteira total
  ]
  const top5Symbols = dynamicPortfolio.map(p => p.symbol)

  const ordersToInsert = []

  // 1. Vendas de ativos que não estão mais no Top 5
  for (const sym of Object.keys(custodiaMap)) {
    if (!top5Symbols.includes(sym)) {
      const pos = custodiaMap[sym]
      if (pos.quantity > 0) {
        ordersToInsert.push({
          team_id: team.id,
          asset_symbol: sym,
          side: 'sell',
          order_type: 'market',
          quantity: pos.quantity,
          status: 'pending'
        })
        console.log(`-> [VENDA ROBÔ] ${sym}: ${pos.quantity} ações (fora do Top 5)`)
      }
    }
  }

  // 2. Rebalanceamento / Compras com os pesos dinâmicos do modelo e 1% de caixa de segurança
  for (const assetConfig of dynamicPortfolio) {
    const sym = assetConfig.symbol
    const pInfo = priceMap[sym]
    const price = pInfo?.openPrice || pInfo?.price || 30.00
    const targetFinancial = allocatableEquity * assetConfig.weight
    const currentQty = custodiaMap[sym]?.quantity || 0
    const targetQty = Math.floor(targetFinancial / price)
    const diff = targetQty - currentQty

    const totalWeightPct = (assetConfig.weight * 0.99 * 100).toFixed(2)

    // Margem mínima de rebalanceamento
    if (diff > 5) {
      ordersToInsert.push({
        team_id: team.id,
        asset_symbol: sym,
        side: 'buy',
        order_type: 'market',
        quantity: diff,
        status: 'pending'
      })
      console.log(`-> [COMPRA ROBÔ] ${sym}: Comprar ${diff} ações (Peso: ${totalWeightPct}%, Alvo: ${targetQty})`)
    } else if (diff < -5) {
      ordersToInsert.push({
        team_id: team.id,
        asset_symbol: sym,
        side: 'sell',
        order_type: 'market',
        quantity: Math.abs(diff),
        status: 'pending'
      })
      console.log(`-> [AJUSTE VENDA] ${sym}: Vender ${Math.abs(diff)} ações para equilibrar em ${totalWeightPct}%`)
    }
  }

  if (ordersToInsert.length > 0) {
    // Remover ordens pendentes antigas da equipe Libra para evitar duplicidade
    await supabase
      .from('orders')
      .delete()
      .eq('team_id', team.id)
      .eq('status', 'pending')

    const { error: ordErr } = await supabase.from('orders').insert(ordersToInsert)
    if (ordErr) {
      console.error('Erro ao inserir ordens da equipe Libra:', ordErr.message)
    } else {
      console.log(`Sucesso: ${ordersToInsert.length} ordens de rebalanceamento registradas para a Equipe Libra.`)
    }
  } else {
    console.log('Carteira da Equipe Libra perfeitamente alinhada com as Top 5 do XGBoost.')
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

  console.log(`Encontrados ${assets.length} ativos. Baixando cotações e séries intraday (1D), 1S e 1M...`)

  const chunkSize = 6
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
    
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log(`Cotações e séries obtidas: ${results.length} de ${assets.length}. Gravando no banco de dados...`)

  for (const quote of results) {
    if (quote.price) {
      const updatePayload = {
        last_price: quote.price,
        updated_at: new Date().toISOString()
      }
      
      if (quote.chartData) {
        updatePayload.chart_data = quote.chartData
      }

      const { error: updateError } = await supabase
        .from('assets')
        .update(updatePayload)
        .eq('symbol', quote.symbol)

      if (updateError) {
        await supabase
          .from('assets')
          .update({ last_price: quote.price, updated_at: new Date().toISOString() })
          .eq('symbol', quote.symbol)
      }
    }
  }

  // 1. Executar liquidação das ordens pendentes com preço de abertura
  await executePendingOrders(priceMap)

  // 2. Executar rebalanceamento automático da Equipe Libra (XGBoost 100% Equity)
  await autoRebalanceLibra(priceMap)

  console.log('\nAtualização diária de séries históricas e automação de ordens concluída.')
  process.exit(0)
}

updatePrices()

