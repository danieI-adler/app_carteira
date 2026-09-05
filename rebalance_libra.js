/* global process */
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Credenciais do Supabase ausentes no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function autoRebalanceLibra() {
  console.log('================================================================================')
  console.log('  AUTOMAÇÃO ROBÔ LIBRA: REBALANCEAMENTO DINÂMICO 100% EQUITY (XGBOOST)')
  console.log('================================================================================')

  // 1. Buscar a equipe Libra no Supabase
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('*')
    .ilike('name', '%libra%')
    .single()

  if (teamErr || !team) {
    console.error('Equipe Libra não encontrada no Supabase:', teamErr?.message)
    return
  }

  console.log(`Equipe Identificada: ${team.name} (ID: ${team.id})`)
  console.log(`Patrimônio Atual: R$ ${parseFloat(team.net_worth || 100000000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Saldo em Caixa : R$ ${parseFloat(team.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  // 2. Buscar posições em custódia atuais da equipe Libra
  const { data: positions, error: posErr } = await supabase
    .from('portfolio_positions')
    .select('*, assets(*)')
    .eq('team_id', team.id)

  if (posErr) {
    console.error('Erro ao buscar posições de custódia:', posErr.message)
    return
  }

  const custodiaMap = {}
  if (positions && positions.length > 0) {
    for (const pos of positions) {
      custodiaMap[pos.asset_symbol] = {
        quantity: parseFloat(pos.quantity),
        average_price: parseFloat(pos.average_price),
        current_price: parseFloat(pos.assets?.last_price || pos.average_price)
      }
    }
  }

  console.log(`Posições Atuais em Custódia: ${Object.keys(custodiaMap).length} ativos`)

  // 3. Executar o modelo Python XGBoost Stock Picking com a custódia atual
  const quantDir = path.resolve(__dirname, '..', '..', '..', 'itau_quant')
  const scriptPython = path.join(quantDir, 'src', 'rebalanceador_libra_100_equity.py')
  const jsonOutput = path.join(quantDir, 'data', 'carteira_libra_100_equity.json')

  let ordersToExecute = []
  const totalNetWorth = parseFloat(team.net_worth || 100000000)

  if (fs.existsSync(scriptPython)) {
    console.log('\nExecutando modelo XGBoost em Python...')
    try {
      execSync(`python "${scriptPython}"`, { cwd: quantDir, stdio: 'inherit' })
      if (fs.existsSync(jsonOutput)) {
        const payload = JSON.parse(fs.readFileSync(jsonOutput, 'utf8'))
        ordersToExecute = payload.ordens_rebalanceamento || []
      }
    } catch (pyErr) {
      console.warn('Erro na execução direta do Python. Usando cálculo integrado:', pyErr.message)
    }
  }

  // Fallback caso execute em ambiente GitHub Actions sem a pasta externa
  if (ordersToExecute.length === 0) {
    // Top 5 Ações do modelo: CMIG4, BRAP4, EQTL3, ALUP11, SBSP3
    const top5Symbols = ['CMIG4', 'BRAP4', 'EQTL3', 'ALUP11', 'SBSP3']
    const targetPerAsset = totalNetWorth / 5

    // Buscar cotações mais recentes no Supabase
    const { data: assetQuotes } = await supabase
      .from('assets')
      .select('symbol, last_price')
      .in('symbol', top5Symbols)

    const priceMap = {}
    assetQuotes?.forEach(a => { priceMap[a.symbol] = parseFloat(a.last_price) })

    for (const sym of top5Symbols) {
      const price = priceMap[sym] || 30.00
      const currentQty = custodiaMap[sym]?.quantity || 0
      const targetQty = Math.floor(targetPerAsset / price)
      const diff = targetQty - currentQty

      if (diff > 0) {
        ordersToExecute.push({
          symbol: sym,
          side: 'buy',
          quantity: diff,
          price,
          total: diff * price
        })
      } else if (diff < 0) {
        ordersToExecute.push({
          symbol: sym,
          side: 'sell',
          quantity: Math.abs(diff),
          price,
          total: Math.abs(diff) * price
        })
      }
    }
  }

  if (ordersToExecute.length === 0) {
    console.log('Nenhuma ordem de rebalanceamento necessária. Carteira 100% equilibrada.')
    return
  }

  console.log(`\nRegistrando ${ordersToExecute.length} ordens a mercado para a Equipe Libra no Supabase...`)

  for (const ord of ordersToExecute) {
    const { error: insErr } = await supabase
      .from('orders')
      .insert({
        team_id: team.id,
        asset_symbol: ord.symbol,
        side: ord.side,
        order_type: 'market',
        quantity: ord.quantity,
        status: 'pending'
      })

    if (insErr) {
      console.error(`Erro ao registrar ordem para ${ord.symbol}:`, insErr.message)
    } else {
      console.log(`-> [ORDEM ENVIADA] ${ord.side.toUpperCase()} ${ord.quantity.toLocaleString()} de ${ord.symbol} a mercado (Preço ref: R$ ${ord.price.toFixed(2)})`)
    }
  }

  console.log('\nRebalanceamento do Robô Libra concluído com sucesso!')
}

autoRebalanceLibra()
