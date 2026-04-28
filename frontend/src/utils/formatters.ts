export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value)
}

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}
