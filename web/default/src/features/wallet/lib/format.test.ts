import { describe, expect, it } from 'vitest'
import { DEFAULT_DISCOUNT_RATE } from '../constants'
import {
  calculatePresetPricing,
  formatCreemPrice,
  formatCurrency,
  formatQuotaShort,
  getDiscountLabel,
} from './format'

describe('wallet format utils', () => {
  it('formats creem prices and short quota values', () => {
    expect(formatCreemPrice(12, 'USD')).toBe('$12.00')
    expect(formatCreemPrice(12.5, 'EUR')).toBe('€12.50')
    expect(formatQuotaShort(999)).toBe('999')
    expect(formatQuotaShort(1500)).toBe('1.5K')
    expect(formatQuotaShort(2500000)).toBe('2.5M')
  })

  it('formats local currency numbers and invalid values', () => {
    expect(formatCurrency(12.3456)).toBe('12.35')
    expect(formatCurrency('0.0009')).toBe('0.0009')
    expect(formatCurrency('oops')).toBe('-')
  })

  it('builds discount labels and preset pricing summaries', () => {
    expect(getDiscountLabel(DEFAULT_DISCOUNT_RATE)).toBe('')
    expect(getDiscountLabel(0.8)).toBe('20% OFF')
    expect(calculatePresetPricing(10, 5, 0.8, 7)).toEqual({
      displayValue: 70,
      originalPrice: 50,
      actualPrice: 40,
      savedAmount: 10,
      hasDiscount: true,
    })
  })

  it('marks preset pricing without discount correctly', () => {
    expect(calculatePresetPricing(5, 2, 1, 1)).toEqual({
      displayValue: 5,
      originalPrice: 10,
      actualPrice: 10,
      savedAmount: 0,
      hasDiscount: false,
    })
  })
})
