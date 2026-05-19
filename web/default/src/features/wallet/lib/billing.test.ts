import { describe, expect, it } from 'vitest'
import {
  PAYMENT_METHOD_NAMES,
  STATUS_CONFIG,
  formatTimestamp,
  getPaymentMethodName,
  getStatusConfig,
} from './billing'

describe('wallet billing utils', () => {
  it('returns status configs with fallback', () => {
    expect(STATUS_CONFIG.success.label).toBe('Success')
    expect(getStatusConfig('success')).toEqual(STATUS_CONFIG.success)
    expect(getStatusConfig('pending')).toEqual(STATUS_CONFIG.pending)
    expect(getStatusConfig('unknown' as never)).toEqual(STATUS_CONFIG.pending)
  })

  it('returns payment method names with optional translation', () => {
    expect(PAYMENT_METHOD_NAMES.wxpay).toBe('WeChat Pay')
    expect(getPaymentMethodName('stripe')).toBe('Stripe')
    expect(getPaymentMethodName('custom')).toBe('custom')
    expect(getPaymentMethodName('alipay', (key) => `t:${key}`)).toBe('t:Alipay')
  })

  it('formats timestamps through shared formatter', () => {
    expect(formatTimestamp(1704067200)).toBe('2024-01-01 08:00:00')
  })

  it('preserves unknown payment methods when translating', () => {
    expect(getPaymentMethodName('crypto', (key) => `x:${key}`)).toBe('x:crypto')
  })
})
