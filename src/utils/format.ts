const currencyFormatter = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const numberFormatter = new Intl.NumberFormat('en-IE');

export const formatCurrency = (value: number): string => currencyFormatter.format(value);
export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatPercentage = (value: number, fractionDigits = 2): string =>
  `${value.toFixed(fractionDigits)}%`;
