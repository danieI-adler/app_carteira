import { supabase } from '../services/supabase'

export async function autoUpdatePricesClientSide(assetsList) {
  if (!assetsList || assetsList.length === 0) return

  const oneHour = 60 * 60 * 1000
  const now = Date.now()

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
    const symbols = assetsList.map(item => (item.assets?.symbol || item.symbol)).filter(Boolean).join(',')
    if (!symbols) return

    const url = `https://brapi.dev/api/quote/${symbols}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Falha ao consultar Brapi API')

    const data = await response.json()
    const results = data.results || []

    for (const item of results) {
      if (item.symbol && item.regularMarketPrice) {
        await supabase
          .from('assets')
          .update({
            last_price: item.regularMarketPrice,
            updated_at: new Date().toISOString()
          })
          .eq('symbol', item.symbol)
      }
    }
    console.log('Sincronização em segundo plano concluída com sucesso.')
  } catch (err) {
    console.warn('Erro ao atualizar cotações automaticamente:', err.message)
  }
}
