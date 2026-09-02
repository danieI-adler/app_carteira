/* global process */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const sqlPath = path.join(__dirname, 'setup_complete_database.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')
  
  // Extract all symbols from SQL INSERT
  const regex = /\('([A-Z0-9]+)',/g
  const symbols = []
  let match
  while ((match = regex.exec(sqlContent)) !== null) {
    if (!symbols.includes(match[1]) && match[1] !== 'buy_commission' && match[1] !== 'sell_commission') {
      symbols.push(match[1])
    }
  }

  console.log(`Buscando séries históricas oficiais para ${symbols.length} ativos...`)

  const history = {}
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }

  const chunkSize = 8
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize)
    
    await Promise.all(chunk.map(async (sym) => {
      try {
        const yahooSymbol = `${sym}.SA`
        const url1m = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1mo&interval=1d`
        const res1m = await fetch(url1m, { headers })
        if (!res1m.ok) return

        const data1m = await res1m.json()
        const result1m = data1m.chart?.result?.[0]
        const meta = result1m?.meta
        const timestamps1m = result1m?.timestamp || []
        const quote1m = result1m?.indicators?.quote?.[0]
        const lastPrice = meta?.regularMarketPrice

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
        }
      } catch {
        // Skip
      }
    }))

    process.stdout.write(`\rProcessados ${Math.min(i + chunkSize, symbols.length)}/${symbols.length}...`)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`\nConcluído! Salvo histórico real de ${Object.keys(history).length} ativos.`)

  const outDir = path.join(__dirname, 'src', 'data')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const outPath = path.join(outDir, 'assetsHistory.json')
  fs.writeFileSync(outPath, JSON.stringify(history, null, 2), 'utf8')
  console.log(`Arquivo salvo em: ${outPath}`)
}

main()
