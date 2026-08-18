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
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (response.status === 404) {
      console.warn(`Aviso: Ativo ${symbol} retornou 404 (provavelmente deslistado ou renomeado). Deletando do banco de dados...`)
      await supabase.from('assets').delete().eq('symbol', symbol)
      return null
    }

    if (!response.ok) {
      console.warn(`Aviso: Falha temporária ao obter cotação de ${symbol} (Status ${response.status})`)
      return null
    }
    
    const data = await response.json()
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice
    return { symbol, price }
  } catch (e) {
    console.warn(`Erro ao consultar ${symbol}:`, e.message)
    return null
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

  console.log(`Encontrados ${assets.length} ativos no banco de dados. Iniciando cotações e auto-limpeza...`)

  // Process in small chunks to prevent rate limits
  const chunkSize = 10
  const results = []

  for (let i = 0; i < assets.length; i += chunkSize) {
    const chunk = assets.slice(i, i + chunkSize)
    console.log(`Processando lote ${i + 1} a ${Math.min(i + chunkSize, assets.length)} de ${assets.length}...`)
    
    const promises = chunk.map(asset => fetchQuote(asset.symbol))
    const chunkResults = await Promise.all(promises)
    results.push(...chunkResults.filter(Boolean))
    
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  console.log(`Cotações válidas obtidas: ${results.length} de ${assets.length}. Atualizando Supabase...`)

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

  console.log('Sincronização e auto-limpeza concluídas com sucesso.')
  process.exit(0)
}

updatePrices()
