import { beforeEach, describe, expect, it } from 'vitest'
import { useSystemConfigStore } from '@/stores/system-config-store'
import {
  API_KEY_FORM_DEFAULT_VALUES,
  getApiKeyFormDefaultValues,
  getApiKeyFormSchema,
  transformApiKeyToFormDefaults,
  transformFormDataToPayload,
} from './api-key-form'

import type { TFunction } from 'i18next'

const t = ((key: string) => key) as TFunction

describe('api-key-form', () => {
  beforeEach(() => {
    useSystemConfigStore.setState((state) => ({
      ...state,
      config: {
        ...state.config,
        currency: { ...state.config.currency, quotaDisplayType: 'USD', quotaPerUnit: 500000, usdExchangeRate: 1 },
      },
    }))
  })

  it('validates required name and non-negative quota when not unlimited', () => {
    const schema = getApiKeyFormSchema(t)
    expect(
      schema.safeParse({
        name: '',
        unlimited_quota: false,
        remain_quota_dollars: -1,
        model_limits: [],
      }).success
    ).toBe(false)

    expect(
      schema.safeParse({
        name: 'Key A',
        unlimited_quota: true,
        model_limits: [],
      }).success
    ).toBe(true)
  })

  it('exposes default values and auto-group variants', () => {
    expect(API_KEY_FORM_DEFAULT_VALUES).toEqual({
      name: '',
      remain_quota_dollars: 10,
      expired_time: undefined,
      unlimited_quota: true,
      model_limits: [],
      allow_ips: '',
      group: '',
      cross_group_retry: true,
      tokenCount: 1,
    })
    expect(getApiKeyFormDefaultValues(true).group).toBe('auto')
    expect(getApiKeyFormDefaultValues(true).cross_group_retry).toBe(true)
    expect(getApiKeyFormDefaultValues(false).group).toBe('')
  })

  it('transforms form data to api payload', () => {
    expect(
      transformFormDataToPayload({
        name: 'Key A',
        remain_quota_dollars: 3,
        expired_time: new Date('2025-01-01T00:00:00Z'),
        unlimited_quota: false,
        model_limits: ['gpt-4o', 'claude-3'],
        allow_ips: '127.0.0.1',
        group: 'auto',
        cross_group_retry: true,
        tokenCount: 2,
      })
    ).toEqual({
      name: 'Key A',
      remain_quota: 1500000,
      expired_time: 1735689600,
      unlimited_quota: false,
      model_limits_enabled: true,
      model_limits: 'gpt-4o,claude-3',
      allow_ips: '127.0.0.1',
      group: 'auto',
      cross_group_retry: true,
    })

    expect(
      transformFormDataToPayload({
        ...API_KEY_FORM_DEFAULT_VALUES,
        name: 'Unlimited',
      })
    ).toEqual({
      name: 'Unlimited',
      remain_quota: 0,
      expired_time: -1,
      unlimited_quota: true,
      model_limits_enabled: false,
      model_limits: '',
      allow_ips: '',
      group: '',
      cross_group_retry: false,
    })
  })

  it('transforms existing api keys into form defaults', () => {
    expect(
      transformApiKeyToFormDefaults({
        id: 1,
        name: 'Existing',
        key: 'sk-1',
        status: 1,
        remain_quota: 2500000,
        used_quota: 0,
        unlimited_quota: false,
        expired_time: 1735689600,
        created_time: 1,
        accessed_time: 1,
        group: '',
        cross_group_retry: 1 as never,
        model_limits_enabled: true,
        model_limits: 'gpt-4o,claude-3',
        allow_ips: '127.0.0.1',
      })
    ).toEqual({
      name: 'Existing',
      remain_quota_dollars: 5,
      expired_time: new Date('2025-01-01T00:00:00.000Z'),
      unlimited_quota: false,
      model_limits: ['gpt-4o', 'claude-3'],
      allow_ips: '127.0.0.1',
      group: '',
      cross_group_retry: true,
      tokenCount: 1,
    })
  })

  it('maps unlimited keys to zero displayed quota and no expiry date', () => {
    expect(
      transformApiKeyToFormDefaults({
        id: 2,
        name: 'Unlimited',
        key: 'sk-2',
        status: 1,
        remain_quota: 0,
        used_quota: 0,
        unlimited_quota: true,
        expired_time: -1,
        created_time: 1,
        accessed_time: 1,
        group: '',
        cross_group_retry: false,
        model_limits_enabled: false,
        model_limits: '',
        allow_ips: '',
      })
    ).toEqual(
      expect.objectContaining({ remain_quota_dollars: 0, expired_time: undefined, group: '' })
    )
  })
})
