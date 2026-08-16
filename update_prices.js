/* global process */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Credenciais do Supabase ausentes no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const symbolMapping = {
  'PETR4': 'PETR4.SA',
  'VALE3': 'VALE3.SA',
  'ITUB4': 'ITUB4.SA',
  'BBDC4': 'BBDC4.SA',
  'BOVA11': 'BOVA11.SA',
  'IVVB11': 'IVVB11.SA',
  'MXRF11': 'MXRF11.SA',
  'HGLG11': 'HGLG11.SA',
  'ALZR11': 'ALZR11.SA'
}

async function fetchQuote(b3Symbol, yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    if (!response.ok) return null
    const data = await response.json()
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice
    return { symbol: b3Symbol, price }
  } catch (e) {
    console.error(`Erro ao consultar ${b3Symbol}:`, e.message)
    return null
  }
}

async function updatePrices() {
  console.log('Iniciando busca de cotações individuais no Yahoo Finance...')
  try {
    const promises = Object.keys(symbolMapping).map(b3Symbol => 
      fetchQuote(b3Symbol, symbolMapping[b3Symbol])
    )
    
    const results = await Promise.all(promises)
    const validQuotes = results.filter(Boolean)

    if (validQuotes.length === 0) {
      throw new Error('Nenhuma cotação válida retornada pela API.')
    }

    console.log(`Encontradas ${validQuotes.length} cotações. Atualizando banco de dados...`)

    for (const quote of validQuotes) {
      if (quote.price) {
        const { error } = await supabase
          .from('assets')
          .update({
            last_price: quote.price,
            updated_at: new Date().toISOString()
          })
          .eq('symbol', quote.symbol)

        if (error) {
          console.error(`Erro ao atualizar ${quote.symbol}:`, error.message)
        } else {
          console.log(`Ativo ${quote.symbol} atualizado para R$ ${quote.price.toFixed(2)}`)
        }
      }
    }

    console.log('Sincronização concluída com sucesso.')
    process.exit(0)
  } catch (err) {
    console.error('Falha na sincronização de cotações:', err.message)
    process.exit(1)
  }
}

updatePrices()
