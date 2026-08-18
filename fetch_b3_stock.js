/* global process */
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// Read symbol from CLI arguments (e.g. node fetch_b3_stock.js WEGE3)
const rawSymbol = process.argv[2]

if (!rawSymbol) {
  console.log('Uso: node fetch_b3_stock.js <TICKER> [tipo: acao|etf|fii]')
  console.log('Exemplo: node fetch_b3_stock.js WEGE3 acao')
  process.exit(1)
}

const symbol = rawSymbol.toUpperCase().trim()
const assetType = (process.argv[3] || 'acao').toLowerCase().trim()

// Initialize Supabase if keys are present (to allow inserting the stock directly)
const hasSupabase = !!(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null

async function fetchB3Stock() {
  const yahooSymbol = `${symbol}.SA`
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`
  
  console.log(`Buscando cotação de ${symbol} (${yahooSymbol}) no Yahoo Finance...`)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Ativo não encontrado ou erro na API (Status ${response.status})`)
    }

    const data = await response.json()
    const meta = data.chart?.result?.[0]?.meta

    if (!meta) {
      throw new Error('Formato de resposta inválido do Yahoo Finance.')
    }

    const currentPrice = meta.regularMarketPrice
    const exchangeName = meta.exchangeName
    const currency = meta.currency

    console.log('\n--- Informações do Ativo ---')
    console.log(`Símbolo B3 : ${symbol}`)
    console.log(`Nome Yahoo : ${meta.symbol}`)
    console.log(`Câmbio     : ${exchangeName} (${currency})`)
    console.log(`Preço Atual: R$ ${currentPrice.toFixed(2)}`)
    console.log('----------------------------\n')

    if (hasSupabase) {
      console.log('Conectado ao Supabase. Salvando/Atualizando ativo no banco de dados...')
      
      const { error } = await supabase
        .from('assets')
        .upsert({
          symbol: symbol,
          name: `${symbol} - Cotado via Yahoo Finance`,
          type: assetType,
          last_price: currentPrice,
          updated_at: new Date().toISOString()
        }, { onConflict: 'symbol' })

      if (error) {
        console.error('Erro ao salvar no Supabase:', error.message)
      } else {
        console.log(`Sucesso: O ativo ${symbol} foi cadastrado e está disponível para negociação!`)
      }
    } else {
      console.log('Nota: Supabase não configurado localmente. O preço foi apenas exibido.')
    }
    
    process.exit(0)
  } catch (err) {
    console.error('Erro ao buscar ativo B3:', err.message)
    process.exit(1)
  }
}

fetchB3Stock()
