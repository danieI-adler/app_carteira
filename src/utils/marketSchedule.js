/**
 * Utility to calculate Market Opening Hours according to competition rules:
 * - Operating Days: Tuesdays, Thursdays, and Weekends (Friday 19h -> Monday 08h).
 * - Operating Hours: 19:00 BRT to 08:00 BRT of next day.
 * - Orders sent during open windows execute at next day's opening price.
 */

export function getMarketStatus(date = new Date()) {
  // Get current date/time in Brazil/Brasília timezone (UTC-3)
  const brtString = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  const brtDate = new Date(brtString)

  const day = brtDate.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const hour = brtDate.getHours()
  const minute = brtDate.getMinutes()
  const timeInMinutes = hour * 60 + minute

  const openAt = 19 * 60 // 19:00
  const closeAt = 8 * 60 // 08:00

  let isOpen = false
  let nextOpening = ''

  // 1. Tuesday evening (19:00 - 23:59) OR Wednesday morning (00:00 - 07:59)
  if ((day === 2 && timeInMinutes >= openAt) || (day === 3 && timeInMinutes < closeAt)) {
    isOpen = true
  }
  // 2. Thursday evening (19:00 - 23:59) OR Friday morning (00:00 - 07:59)
  else if ((day === 4 && timeInMinutes >= openAt) || (day === 5 && timeInMinutes < closeAt)) {
    isOpen = true
  }
  // 3. Weekend Window: Friday 19:00 -> Saturday -> Sunday -> Monday 08:00
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
    if (day === 1) { // Monday after 08:00 -> Opens Tuesday 19:00
      nextOpening = 'Terça-feira às 19h00'
    } else if (day === 2) { // Tuesday before 19:00 -> Opens Tuesday 19:00
      nextOpening = 'Hoje (Terça) às 19h00'
    } else if (day === 3) { // Wednesday after 08:00 -> Opens Thursday 19:00
      nextOpening = 'Quinta-feira às 19h00'
    } else if (day === 4) { // Thursday before 19:00 -> Opens Thursday 19:00
      nextOpening = 'Hoje (Quinta) às 19h00'
    } else if (day === 5) { // Friday before 19:00 -> Opens Friday 19:00
      nextOpening = 'Hoje (Sexta) às 19h00'
    } else {
      nextOpening = 'Terça-feira às 19h00'
    }
  }

  return {
    isOpen,
    statusLabel: isOpen ? 'Mercado Aberto' : 'Mercado Fechado',
    nextOpening,
    formattedBrtTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    operatingSchedule: 'Terças, Quintas e Fins de Semana (19h00 às 08h00)'
  }
}
