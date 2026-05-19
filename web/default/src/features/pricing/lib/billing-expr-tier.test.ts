import { describe, expect, it } from 'vitest'
import {
  BILLING_CACHE_VAR_MAP,
  BILLING_CONDITION_VARS,
  BILLING_EXTRA_VARS,
  BILLING_PRICING_VARS,
  BILLING_VARS,
  parseTiersFromExpr,
  normalizeTierLabel,
} from './billing-expr'

describe('billing-expr tier parsing', () => {
  it('exposes consistent billing variable registries', () => {
    expect(BILLING_VARS.map((item) => item.key)).toContain('len')
    expect(BILLING_PRICING_VARS.map((item) => item.key)).not.toContain('len')
    expect(BILLING_CONDITION_VARS).toEqual(['p', 'c', 'len'])
    expect(BILLING_EXTRA_VARS.map((item) => item.key)).toEqual(['cr', 'cc', 'cc1h', 'img', 'img_o', 'ai', 'ao'])
    expect(BILLING_CACHE_VAR_MAP).toContainEqual({ field: 'cache_read_unit_cost', exprVar: 'cr' })
  })

  it('parses tier expressions with optional conditions and all mapped fields', () => {
    const tiers = parseTiersFromExpr(
      'v2:p <= 1000 && len >= 10 ? tier("small", p * 1 + c * 2 + cr * 3 + img * 4) : tier("base", p * 5 + c * 6 + ao * 7)'
    )
    expect(tiers).toHaveLength(2)
    expect(tiers[0]).toEqual(
      expect.objectContaining({
        label: 'small',
        inputPrice: 1,
        outputPrice: 2,
        cacheReadPrice: 3,
        imagePrice: 4,
        conditions: [
          { var: 'p', op: '<=', value: 1000 },
          { var: 'len', op: '>=', value: 10 },
        ],
      })
    )
    expect(tiers[1]).toEqual(
      expect.objectContaining({ label: 'base', inputPrice: 5, outputPrice: 6, audioOutputPrice: 7 })
    )
  })

  it('normalizes tier labels and safely handles invalid expressions', () => {
    expect(normalizeTierLabel(' P ≤ 1K ')).toBe('p<1k')
    expect(normalizeTierLabel(undefined)).toBe('')
    expect(parseTiersFromExpr('')).toEqual([])
    expect(parseTiersFromExpr('not a tier expr')).toEqual([])
  })

  it('parses tiers without explicit conditions', () => {
    expect(parseTiersFromExpr('tier("base", p * 1 + c * 2)')).toEqual([
      expect.objectContaining({ label: 'base', inputPrice: 1, outputPrice: 2, conditions: [] }),
    ])
  })
})
