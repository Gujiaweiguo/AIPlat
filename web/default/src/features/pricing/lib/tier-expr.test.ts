import { describe, expect, it } from 'vitest'
import {
  CACHE_MODE_GENERIC,
  CACHE_MODE_TIMED,
  ESTIMATOR_EXTRA_FIELDS,
  createDefaultVisualConfig,
  evalExprLocally,
  exprUsesExtraVars,
  generateExprFromVisualConfig,
  getTierCacheMode,
  normalizeVisualConfig,
  normalizeVisualTier,
  tryParseVisualConfig,
} from './tier-expr'

describe('tier-expr', () => {
  it('derives and normalizes cache mode and numeric tier values', () => {
    expect(getTierCacheMode({ cache_mode: CACHE_MODE_TIMED })).toBe(CACHE_MODE_TIMED)
    expect(getTierCacheMode({ cache_create_1h_unit_cost: 2 })).toBe(CACHE_MODE_TIMED)
    expect(getTierCacheMode({})).toBe(CACHE_MODE_GENERIC)

    const tier = normalizeVisualTier({
      label: 'vip',
      input_unit_cost: '2' as unknown as number,
      cache_read_unit_cost: '3' as unknown as number,
    })
    expect(tier.label).toBe('vip')
    expect(tier.input_unit_cost).toBe('2')
    expect(tier.cache_read_unit_cost).toBe(3)
    expect(tier.cache_mode).toBe(CACHE_MODE_GENERIC)
  })

  it('creates and normalizes visual configs with defaults', () => {
    expect(createDefaultVisualConfig()).toEqual({
      tiers: [
        expect.objectContaining({ label: 'base', input_unit_cost: 0, output_unit_cost: 0 }),
      ],
    })
    expect(normalizeVisualConfig(null).tiers).toHaveLength(1)
    expect(normalizeVisualConfig({ tiers: [{ label: 'x', input_unit_cost: 1, output_unit_cost: 2, conditions: [], cache_mode: 'generic' }] }).tiers[0].output_unit_cost).toBe(2)
  })

  it('generates expressions for single and multi-tier configs', () => {
    expect(generateExprFromVisualConfig(null)).toBe('p * 0 + c * 0')
    expect(
      generateExprFromVisualConfig({
        tiers: [
          normalizeVisualTier({ label: 'base', input_unit_cost: 1, output_unit_cost: 2, conditions: [] }),
        ],
      })
    ).toBe('tier("base", p * 1 + c * 2)')
    expect(
      generateExprFromVisualConfig({
        tiers: [
          normalizeVisualTier({ label: 'small', input_unit_cost: 1, output_unit_cost: 2, conditions: [{ var: 'p', op: '<=', value: 1000 }] }),
          normalizeVisualTier({ label: 'large', input_unit_cost: 3, output_unit_cost: 4, conditions: [] }),
        ],
      })
    ).toBe('p <= 1000 ? tier("small", p * 1 + c * 2) : tier("large", p * 3 + c * 4)')
  })

  it('parses supported visual expressions and rejects mismatches', () => {
    const parsedSingle = tryParseVisualConfig('v2:tier("base", p * 1 + c * 2 + cr * 3)')
    expect(parsedSingle?.tiers[0]).toEqual(
      expect.objectContaining({ label: 'base', input_unit_cost: 1, output_unit_cost: 2, cache_read_unit_cost: 3 })
    )

    const parsedMulti = tryParseVisualConfig(
      'p <= 1000 ? tier("small", p * 1 + c * 2) : tier("large", p * 3 + c * 4)'
    )
    expect(parsedMulti?.tiers).toHaveLength(2)
    expect(parsedMulti?.tiers[0].conditions).toEqual([{ var: 'p', op: '<=', value: 1000 }])
    expect(tryParseVisualConfig('tier("bad", c * 2 + p * 1)')).toBeNull()
    expect(tryParseVisualConfig('')).toBeNull()
  })

  it('evaluates expressions locally and reports errors and extra vars', () => {
    expect(
      evalExprLocally('tier("base", p * 2 + c * 3 + cr * 4)', 10, 5, {
        cacheReadTokens: 2,
        cacheCreateTokens: 0,
        cacheCreate1hTokens: 0,
        imageTokens: 0,
        imageOutputTokens: 0,
        audioInputTokens: 0,
        audioOutputTokens: 0,
      })
    ).toEqual({ cost: 43, matchedTier: 'base', error: null })

    const failed = evalExprLocally('unknown(', 1, 1, {
      cacheReadTokens: 0,
      cacheCreateTokens: 0,
      cacheCreate1hTokens: 0,
      imageTokens: 0,
      imageOutputTokens: 0,
      audioInputTokens: 0,
      audioOutputTokens: 0,
    })
    expect(failed.cost).toBe(0)
    expect(failed.error).toBeTruthy()
    expect(exprUsesExtraVars('p * 1 + img * 2')).toBe(true)
    expect(exprUsesExtraVars('p * 1 + c * 2')).toBe(false)
    expect(ESTIMATOR_EXTRA_FIELDS.map((field) => field.var)).toEqual(['cr', 'cc', 'cc1h', 'img', 'img_o', 'ai', 'ao'])
  })

  it('returns zero cost for empty local expressions', () => {
    expect(
      evalExprLocally('', 1, 1, {
        cacheReadTokens: 0,
        cacheCreateTokens: 0,
        cacheCreate1hTokens: 0,
        imageTokens: 0,
        imageOutputTokens: 0,
        audioInputTokens: 0,
        audioOutputTokens: 0,
      })
    ).toEqual({ cost: 0, matchedTier: '', error: null })
  })
})
