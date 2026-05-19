import { beforeEach, describe, expect, it } from 'vitest'
import { useSystemConfigStore } from '@/stores/system-config-store'
import { QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel } from '../types'
import {
  formatFixedPrice,
  formatGroupPrice,
  formatPrice,
  formatRequestPrice,
  stripTrailingZeros,
} from './price'

function createPricingModel(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'gpt-4o',
    quota_type: QUOTA_TYPE_VALUES.TOKEN,
    model_ratio: 2,
    completion_ratio: 1.5,
    enable_groups: ['default', 'vip'],
    group_ratio: { default: 1, vip: 0.5 },
    ...overrides,
  }
}

describe('price', () => {
  beforeEach(() => {
    useSystemConfigStore.setState((state) => ({
      ...state,
      config: {
        ...state.config,
        currency: { ...state.config.currency, quotaDisplayType: 'USD', usdExchangeRate: 1 },
      },
    }))
  })

  it('strips trailing zeros while preserving prefix and suffix', () => {
    expect(stripTrailingZeros('$1.2300')).toBe('$1.23')
    expect(stripTrailingZeros('¥1.000k')).toBe('¥1k')
    expect(stripTrailingZeros('plain-text')).toBe('plain-text')
  })

  it('formats token prices using minimum enabled group ratio', () => {
    const model = createPricingModel()
    expect(formatPrice(model, 'input', 'M')).toBe('$2')
    expect(formatPrice(model, 'output', 'M')).toBe('$3')
  })

  it('formats cache and media prices when optional ratios exist', () => {
    const model = createPricingModel({
      cache_ratio: 0.25,
      create_cache_ratio: 1.25,
      image_ratio: 3,
      audio_ratio: 2,
      audio_completion_ratio: 4,
    })
    expect(formatPrice(model, 'cache', 'M')).toBe('$0.5')
    expect(formatPrice(model, 'create_cache', 'M')).toBe('$2.5')
    expect(formatPrice(model, 'image', 'M')).toBe('$6')
    expect(formatPrice(model, 'audio_input', 'M')).toBe('$4')
    expect(formatPrice(model, 'audio_output', 'M')).toBe('$16')
  })

  it('applies recharge rate and token-unit divisors', () => {
    const model = createPricingModel()
    expect(formatPrice(model, 'input', 'K', true, 0.5, 1)).toBe('$0.001')
    expect(formatGroupPrice(model, 'default', 'output', 'M', true, 2, 4, { default: 2 })).toBe('$6')
  })

  it('returns dash for incompatible quota types or missing request pricing', () => {
    const requestModel = createPricingModel({ quota_type: QUOTA_TYPE_VALUES.REQUEST, model_price: 3 })
    expect(formatPrice(requestModel, 'input', 'M')).toBe('-')
    expect(formatGroupPrice(requestModel, 'default', 'input', 'M', false, 1, 1, { default: 1 })).toBe('-')
    expect(formatFixedPrice(createPricingModel(), 'default', false, 1, 1, { default: 1 })).toBe('-')
    expect(formatRequestPrice(createPricingModel())).toBe('-')
  })

  it('returns NaN-backed formatter output when optional ratios are missing', () => {
    const model = createPricingModel()
    expect(formatPrice(model, 'cache', 'M')).toBe('-')
    expect(formatPrice(model, 'audio_output', 'M')).toBe('-')
  })

  it('formats fixed request prices from group ratio and minimum group ratio', () => {
    const requestModel = createPricingModel({
      quota_type: QUOTA_TYPE_VALUES.REQUEST,
      model_price: 10,
      enable_groups: ['default', 'vip'],
      group_ratio: { default: 2, vip: 0.5 },
    })
    expect(formatFixedPrice(requestModel, 'default', false, 1, 1, { default: 2 })).toBe('$20')
    expect(formatRequestPrice(requestModel)).toBe('$5')
    expect(formatRequestPrice(requestModel, true, 4, 8)).toBe('$2.5')
  })
})
