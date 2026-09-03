/**
 * Utility to calculate Market Opening Hours according to competition rules:
 * - Challenge Period: 04/09/2026 19:00 BRT to 02/10/2026 19:00 BRT (Desafio Beta).
 * - Operating Days: Tuesdays, Thursdays, and Weekends (Friday 19h -> Monday 08h).
 * - Operating Hours: 19:00 BRT to 08:00 BRT of next day.
 * - Orders sent during open windows execute at next day's opening price.
 */

export const COMPETITION_START_BRT = '2026-09-04T19:00:00-03:00'
export const COMPETITION_END_BRT = '2026-10-02T19:00:00-03:00'

export function getMarketStatus(date = new Date()) {
  // Current time in Brazil/Brasília timezone (UTC-3)
  const brtString = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  const brtDate = new Date(brtString)

  const startDate = new Date(COMPETITION_START_BRT)
  const endDate = new Date(COMPETITION_END_BRT)

  const hour = brtDate.getHours()
  const minute = brtDate.getMinutes()
  const formattedBrtTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  // 1. Before Competition Start (Before 04/09/2026 19:00 BRT)
  if (date < startDate) {
    return {
      isOpen: false,
      statusLabel: 'Mercado Fechado',
      nextOpening: 'Início do Desafio Beta: Sexta (04/09) às 19h00',
      formattedBrtTime,
      operatingSchedule: 'Desafio Beta: 04/09 a 02/10 (Terças, Quintas e Fins de Semana das 19h às 08h)',
      isBeforeStart: true,
      isAfterEnd: false
    }
  }

  // 2. After Competition End (After 02/10/2026 19:00 BRT)
  if (date > endDate) {
    return {
      isOpen: false,
      statusLabel: 'Desafio Encerrado',
      nextOpening: 'Desafio Beta Finalizado em 02/10/2026',
      formattedBrtTime,
      operatingSchedule: 'Competição Encerrada',
      isBeforeStart: false,
      isAfterEnd: true
    }
  }

  // 3. During Competition Period (04/09 to 02/10): Apply Standard Operational Rules
  const day = brtDate.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const timeInMinutes = hour * 60 + minute

  const openAt = 19 * 60 // 19:00
  const closeAt = 8 * 60 // 08:00

  let isOpen = false
  let nextOpening = ''

  // A. Tuesday evening (19:00 - 23:59) OR Wednesday morning (00:00 - 07:59)
  if ((day === 2 && timeInMinutes >= openAt) || (day === 3 && timeInMinutes < closeAt)) {
    isOpen = true
  }
  // B. Thursday evening (19:00 - 23:59) OR Friday morning (00:00 - 07:59)
  else if ((day === 4 && timeInMinutes >= openAt) || (day === 5 && timeInMinutes < closeAt)) {
    isOpen = true
  }
  // C. Weekend Window: Friday 19:00 -> Saturday -> Sunday -> Monday 08:00
  else if (
    (day === 5 && timeInMinutes >= openAt) || // Friday after 19:00
    day === 6 || // Saturday all day
    day === 0 || // Sunday all day
    (day === 1 && timeInMinutes < closeAt) // Monday before 08:00
  ) {
    isOpen = true
  }

  // Calculate Next Opening window for informative banner
  if (!isOpen) {
    if (day === 1) {
      nextOpening = 'Terça-feira às 19h00'
    } else if (day === 2) {
      nextOpening = 'Hoje (Terça) às 19h00'
    } else if (day === 3) {
      nextOpening = 'Quinta-feira às 19h00'
    } else if (day === 4) {
      nextOpening = 'Hoje (Quinta) às 19h00'
    } else if (day === 5) {
      nextOpening = 'Hoje (Sexta) às 19h00'
    } else {
      nextOpening = 'Terça-feira às 19h00'
    }
  }

  return {
    isOpen,
    statusLabel: isOpen ? 'Mercado Aberto' : 'Mercado Fechado',
    nextOpening,
    formattedBrtTime,
    operatingSchedule: 'Desafio Beta: 04/09 a 02/10 (Terças, Quintas e Fins de Semana das 19h às 08h)',
    isBeforeStart: false,
    isAfterEnd: false
  }
}
