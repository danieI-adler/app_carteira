import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GAMA_ASSETS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' },
  { symbol: 'XLB', name: 'Materials Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLI', name: 'Industrial Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLP', name: 'Consumer Staples Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLU', name: 'Utilities Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XLY', name: 'Consumer Discretionary Select Sector SPDR Fund', type: 'etf' },
  { symbol: 'XTN', name: 'SPDR S&P Transportation ETF', type: 'etf' },
  { symbol: 'EWJ', name: 'iShares MSCI Japan ETF', type: 'etf' },
  { symbol: 'EWG', name: 'iShares MSCI Germany ETF', type: 'etf' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF', type: 'etf' },
  { symbol: 'EWZ', name: 'iShares MSCI Brazil ETF', type: 'etf' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'etf' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf' },
  { symbol: 'FXE', name: 'Invesco CurrencyShares Euro Trust', type: 'etf' },
]

async function main() {
  console.log(`Baixando séries históricas oficiais para os 18 ETFs do Desafio Gama...`)

  const history = {}
  const latestQuotes = []
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }

  for (const item of GAMA_ASSETS) {
    const sym = item.symbol
    try {
      // US ETFs do not have .SA suffix
      const url1m = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1mo&interval=1d`
      const res1m = await fetch(url1m, { headers })
      if (!res1m.ok) {
        console.warn(`Falha ao obter ${sym}: status ${res1m.status}`)
        continue
      }

      const data1m = await res1m.json()
      const result1m = data1m.chart?.result?.[0]
      const meta = result1m?.meta
      const timestamps1m = result1m?.timestamp || []
      const quote1m = result1m?.indicators?.quote?.[0]
      const lastPrice = meta?.regularMarketPrice || 100.00

      const points1m = []
      for (let j = 0; j < timestamps1m.length; j++) {
        let c = quote1m?.close?.[j]
        if ((c === null || typeof c !== 'number' || isNaN(c)) && j === timestamps1m.length - 1 && lastPrice) {
          c = lastPrice
        }
        if (c !== null && typeof c === 'number' && !isNaN(c) && c > 0) {
          const d = new Date(timestamps1m[j] * 1000)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const isLast = j === timestamps1m.length - 1
          points1m.push({
            price: parseFloat(c.toFixed(2)),
            open: quote1m.open?.[j] ? parseFloat(quote1m.open[j].toFixed(2)) : parseFloat(c.toFixed(2)),
            high: quote1m.high?.[j] ? parseFloat(quote1m.high[j].toFixed(2)) : parseFloat(c.toFixed(2)),
            low: quote1m.low?.[j] ? parseFloat(quote1m.low[j].toFixed(2)) : parseFloat(c.toFixed(2)),
            label: isLast ? 'Atual' : `${day}/${month}`
          })
        }
      }

      if (points1m.length > 0) {
        history[sym] = {
          '1m': points1m,
          '1w': points1m.slice(-6),
          '1d': points1m.slice(-2)
        }
        latestQuotes.push({
          ...item,
          last_price: lastPrice
        })
        console.log(`[OK] ${sym}: Preço Atual = $${lastPrice.toFixed(2)} | Candles 1M: ${points1m.length}`)
      }
    } catch (err) {
      console.error(`Erro ao processar ${sym}:`, err.message)
    }
  }

  const outDir = path.join(__dirname, 'src', 'data')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const outPath = path.join(outDir, 'assetsHistory.json')
  fs.writeFileSync(outPath, JSON.stringify(history, null, 2), 'utf8')
  console.log(`\nHistórico dos 18 ETFs salvo com sucesso em: ${outPath}`)

  return latestQuotes
}

main()
