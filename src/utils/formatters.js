export const formatUSD = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val || 0)
}

// Alias to ensure all existing components format as USD ($)
export const formatBRL = formatUSD
