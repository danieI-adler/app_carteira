/* global process */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Credenciais do Supabase ausentes no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

  console.log(`Encontrados ${assets.length} ativos. Iniciando cotações no Yahoo Finance...`)

  // Split into batches of 40 symbols to keep URLs safe and performant
  const batchSize = 40
  const batches = []
  for (let i = 0; i < assets.length; i += batchSize) {
    batches.push(assets.slice(i, i + batchSize))
  }

  try {
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const yahooSymbols = batch.map(a => `${a.symbol}.SA`).join(',')
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}`

      console.log(`Consultando lote ${i + 1}/${batches.length}...`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro na API do Yahoo Finance: Status ${response.status}`)
      }

      const data = await response.json()
      const quotes = data.quoteResponse?.result || []

      for (const quote of quotes) {
        const b3Symbol = quote.symbol.replace('.SA', '')
        const price = quote.regularMarketPrice

        if (price) {
          const { error: updateError } = await supabase
            .from('assets')
            .update({
              last_price: price,
              updated_at: new Date().toISOString()
            })
            .eq('symbol', b3Symbol)

          if (updateError) {
            console.error(`Erro ao atualizar ${b3Symbol}:`, updateError.message)
          }
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
