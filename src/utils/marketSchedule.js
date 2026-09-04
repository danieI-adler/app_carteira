/**
 * Desafio Interno Gama - Regras de Abertura de Mercado:
 * - O mercado abre ÚNICA E EXCLUSIVAMENTE nos Fins de Semana.
 * - Janela Semanal: Sexta-feira às 19h00 BRT até Segunda-feira às 08h00 BRT.
 * - Ordens a mercado são liquidadas com o preço de abertura da sessão de segunda-feira.
 */

export function getMarketStatus(date = new Date()) {
  // Current time in Brazil/Brasília timezone (UTC-3)
  const brtString = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  const brtDate = new Date(brtString)

  const day = brtDate.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const hour = brtDate.getHours()
  const minute = brtDate.getMinutes()
  const timeInMinutes = hour * 60 + minute
  const formattedBrtTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const openAt = 19 * 60 // 19:00
  const closeAt = 8 * 60 // 08:00

  let isOpen = false
  let nextOpening = ''

  // Weekend Window: Friday after 19:00 -> Saturday -> Sunday -> Monday before 08:00
  if (
    (day === 5 && timeInMinutes >= openAt) || // Friday after 19:00
    day === 6 || // Saturday all day
    day === 0 || // Sunday all day
    (day === 1 && timeInMinutes < closeAt) // Monday before 08:00
  ) {
    isOpen = true
  }

  // Calculate Next Opening window for informative banner
  if (!isOpen) {
    if (day === 5) {
      nextOpening = 'Hoje (Sexta-feira) às 19h00'
    } else {
      nextOpening = 'Sexta-feira às 19h00'
    }
  }

  return {
    isOpen,
    statusLabel: isOpen ? 'Mercado Aberto (Fim de Semana)' : 'Mercado Fechado',
    nextOpening,
    formattedBrtTime,
    operatingSchedule: 'Desafio Gama: Fins de Semana (Sexta 19h00 às Segunda 08h00 BRT)'
  }
}
