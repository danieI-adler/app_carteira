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
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (response.status === 404) {
      console.warn(`Aviso: Ativo ${symbol} retornou 404 (deslistado ou renomeado). Deletando do banco...`)
      await supabase.from('assets').delete().eq('symbol', symbol)
      return null
    }

    if (!response.ok) {
      console.warn(`Aviso: Falha temporária ao obter cotação de ${symbol} (Status ${response.status})`)
      return null
    }
    
    const data = await response.json()
    const meta = data.chart?.result?.[0]?.meta
    const quote = data.chart?.result?.[0]?.indicators?.quote?.[0]
    
    const lastPrice = meta?.regularMarketPrice || null
    
    // Obter o preço de abertura da sessão mais recente
    let openPrice = null
    if (quote?.open && quote.open.length > 0) {
      const validOpens = quote.open.filter(val => typeof val === 'number' && !isNaN(val) && val > 0)
      if (validOpens.length > 0) {
        openPrice = validOpens[validOpens.length - 1]
      }
    }
    if (!openPrice) {
      openPrice = lastPrice
    }

    return { 
      symbol, 
      price: lastPrice, 
      openPrice: openPrice ? parseFloat(openPrice.toFixed(2)) : lastPrice 
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

    // Executar com o preço de abertura (ou último preço)
    const execPrice = assetPriceInfo.openPrice || assetPriceInfo.price
    if (!execPrice || execPrice <= 0) {
      console.warn(`Preço inválido para ${order.asset_symbol}. Pulando ordem ${order.id}.`)
      continue
    }

    const totalCost = order.quantity * execPrice

    try {
      // 1. Obter dados da equipe
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
          console.warn(`Saldo insuficiente para ordem de compra ${order.id} (Saldo: ${team.balance}, Custo: ${totalCost}). Cancelando...`)
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
          continue
        }

        // Deduzir saldo
        await supabase
          .from('teams')
          .update({ balance: team.balance - totalCost })
          .eq('id', order.team_id)

        // Atualizar ou criar posição
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

        // Registrar transação
        await supabase
          .from('transactions')
          .insert({
            team_id: order.team_id,
            asset_symbol: order.asset_symbol,
            quantity: order.quantity,
            price: execPrice,
            transaction_type: 'buy'
          })

        // Concluir ordem
        await supabase
          .from('orders')
          .update({
            status: 'executed',
            execution_price: execPrice,
            executed_at: new Date().toISOString()
          })
          .eq('id', order.id)

        console.log(`Ordem de COMPRA ${order.id} executada com sucesso a R$ ${execPrice} (Abertura).`)

      } else if (order.side === 'sell') {
        const { data: currentPos } = await supabase
          .from('portfolio_positions')
          .select('quantity')
          .eq('team_id', order.team_id)
          .eq('asset_symbol', order.asset_symbol)
          .eq('position_type', 'long')
          .single()

        if (!currentPos || currentPos.quantity < order.quantity) {
          console.warn(`Posição insuficiente para ordem de venda ${order.id}. Cancelando...`)
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
          continue
        }

        // Creditar saldo
        await supabase
          .from('teams')
          .update({ balance: team.balance + totalCost })
          .eq('id', order.team_id)

        // Atualizar quantidade da posição
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

        // Registrar transação
        await supabase
          .from('transactions')
          .insert({
            team_id: order.team_id,
            asset_symbol: order.asset_symbol,
            quantity: order.quantity,
            price: execPrice,
            transaction_type: 'sell'
          })

        // Concluir ordem
        await supabase
          .from('orders')
          .update({
            status: 'executed',
            execution_price: execPrice,
            executed_at: new Date().toISOString()
          })
          .eq('id', order.id)

        console.log(`Ordem de VENDA ${order.id} executada com sucesso a R$ ${execPrice} (Abertura).`)
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

  console.log(`Encontrados ${assets.length} ativos no banco de dados. Iniciando cotações diárias das 19h...`)

  const chunkSize = 10
  const results = []
  const priceMap = {}

  for (let i = 0; i < assets.length; i += chunkSize) {
    const chunk = assets.slice(i, i + chunkSize)
    console.log(`Processando lote ${i + 1} a ${Math.min(i + chunkSize, assets.length)} de ${assets.length}...`)
    
    const promises = chunk.map(asset => fetchQuote(asset.symbol))
    const chunkResults = await Promise.all(promises)
    
    for (const res of chunkResults.filter(Boolean)) {
      results.push(res)
      priceMap[res.symbol] = res
    }
    
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  console.log(`Cotações válidas obtidas: ${results.length} de ${assets.length}. Atualizando banco de dados...`)

  for (const quote of results) {
    if (quote.price) {
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          last_price: quote.price,
          updated_at: new Date().toISOString()
        })
        .eq('symbol', quote.symbol)

      if (updateError) {
        console.error(`Erro ao atualizar no Supabase ${quote.symbol}:`, updateError.message)
      }
    }
  }

  // Executar ordens a mercado pendentes com o preço de abertura
  await executePendingOrders(priceMap)

  console.log('Ciclo diário das 19h concluído com sucesso.')
  process.exit(0)
}

updatePrices()
