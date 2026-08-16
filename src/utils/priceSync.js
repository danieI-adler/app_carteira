import { supabase } from '../services/supabase'

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

async function fetchQuoteClient(b3Symbol, yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice
    return { symbol: b3Symbol, price }
  } catch (e) {
    console.warn(`Erro ao consultar cotação de ${b3Symbol}:`, e.message)
    return null
  }
}

export async function autoUpdatePricesClientSide(assetsList) {
  if (!assetsList || assetsList.length === 0) return

  const oneHour = 60 * 60 * 1000
  const now = Date.now()

  // Check if any asset needs an update (updated_at older than 1 hour)
  const needsUpdate = assetsList.some(item => {
    const assetObj = item.assets || item
    const lastUpdate = new Date(assetObj.updated_at || 0).getTime()
    return (now - lastUpdate) > oneHour
  })

  if (!needsUpdate) {
    console.log('Cotações locais atualizadas. Pulando sincronização.')
    return
  }

  console.log('Cotações locais desatualizadas. Iniciando sincronização em segundo plano...')

  try {
    const promises = Object.keys(symbolMapping).map(b3Symbol =>
      fetchQuoteClient(b3Symbol, symbolMapping[b3Symbol])
    )
    
    const results = await Promise.all(promises)
    const validQuotes = results.filter(Boolean)

    for (const quote of validQuotes) {
      if (quote.price) {
        await supabase
          .from('assets')
          .update({
            last_price: quote.price,
            updated_at: new Date().toISOString()
          })
          .eq('symbol', quote.symbol)
      }
    }
    console.log('Sincronização em segundo plano concluída com sucesso.')
  } catch (err) {
    console.warn('Erro ao atualizar cotações automaticamente:', err.message)
  }
}
