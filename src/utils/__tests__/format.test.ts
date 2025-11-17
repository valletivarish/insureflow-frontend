import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/format';

describe('format helpers', () => {
  it('formats currency in euros', () => {
    expect(formatCurrency(1234.5)).toBe('€1,234.50');
  });

  it('formats numbers with grouping', () => {
    expect(formatNumber(9876543)).toBe('9,876,543');
  });

  it('formats percentages with default precision', () => {
    expect(formatPercentage(12.3456)).toBe('12.35%');
  });
});

