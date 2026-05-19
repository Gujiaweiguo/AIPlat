import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSystemConfigStore } from '@/stores/system-config-store'
import {
  aggregateChannelsByTag,
  channelNeedsAttention,
  countKeys,
  deduplicateKeys,
  formatBalance,
  formatChannelKey,
  formatGroupsString,
  formatKeyPreview,
  formatModelsString,
  formatQuota,
  formatRelativeTime,
  formatResponseTime,
  formatTimestamp,
  getAttentionReason,
  getBalanceVariant,
  getChannelStatusBadge,
  getChannelTypeIcon,
  getChannelTypeLabel,
  getKeyPromptForType,
  getMultiKeyStatusBadge,
  getPriorityDisplay,
  getResponseTimeConfig,
  getWeightDisplay,
  isChannelEnabled,
  isMultiKeyChannel,
  isTagAggregateRow,
  parseChannelOtherSettings,
  parseChannelSettings,
  parseGroupsList,
  parseModelsList,
  validateApiKey,
  validateChannelName,
  validateChannelSettings,
  validateGroups,
  validateModels,
} from './channel-utils'
import type { Channel } from '../types'

function createChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 1,
    type: 1,
    key: 'sk-test-key-value',
    openai_organization: null,
    test_model: null,
    status: 1,
    name: 'Test Channel',
    weight: 10,
    created_time: 1,
    test_time: 1,
    response_time: 300,
    base_url: null,
    other: '',
    balance: 0,
    balance_updated_time: 1,
    models: 'gpt-4o',
    group: 'default',
    used_quota: 100,
    model_mapping: null,
    status_code_mapping: null,
    priority: 1,
    auto_ban: 1,
    other_info: '',
    tag: 'alpha',
    setting: null,
    param_override: null,
    header_override: null,
    remark: '',
    max_input_tokens: 0,
    channel_info: {
      is_multi_key: false,
      multi_key_size: 0,
      multi_key_polling_index: 0,
      multi_key_mode: 'random',
    },
    settings: '{}',
    ...overrides,
  }
}

describe('channel-utils', () => {
  beforeEach(() => {
    useSystemConfigStore.setState((state) => ({
      ...state,
      config: {
        ...state.config,
        currency: {
          ...state.config.currency,
          quotaDisplayType: 'USD',
          quotaPerUnit: 500000,
          usdExchangeRate: 1,
          customCurrencyExchangeRate: 1,
          customCurrencySymbol: '¤',
        },
      },
    }))
    vi.useRealTimers()
  })

  it('returns labels, icons and badges with fallbacks', () => {
    expect(getChannelTypeLabel(1)).toBe('OpenAI')
    expect(getChannelTypeLabel(999)).toBe('Unknown')
    expect(getChannelTypeIcon(24)).toBe('Gemini')
    expect(getChannelTypeIcon(999)).toBe('OpenAI')
    expect(getChannelStatusBadge(999)).toEqual(getChannelStatusBadge(0))
    expect(getMultiKeyStatusBadge(999)).toEqual(getMultiKeyStatusBadge(1))
  })

  it('checks enabled and multi-key flags', () => {
    expect(isChannelEnabled(createChannel({ status: 1 }))).toBe(true)
    expect(isChannelEnabled(createChannel({ status: 2 }))).toBe(false)
    expect(
      isMultiKeyChannel(
        createChannel({ channel_info: { is_multi_key: true, multi_key_size: 2, multi_key_polling_index: 0, multi_key_mode: 'polling' } })
      )
    ).toBe(true)
    expect(isMultiKeyChannel(createChannel())).toBe(false)
  })

  it('formats keys, previews and counts multiline keys', () => {
    expect(formatChannelKey('abcd1234')).toBe('abcd...1234')
    expect(formatChannelKey('1234567890abcdefXYZ987654321')).toBe('12345678...87654321')
    expect(formatChannelKey('k1\n\nk2\n', true)).toBe('2 keys')
    expect(formatKeyPreview('abcdefghijk', 5)).toBe('abcde...')
    expect(formatKeyPreview('abc', 5)).toBe('abc')
    expect(countKeys('a\n\n b \n')).toBe(2)
  })

  it('parses and formats model and group lists', () => {
    expect(parseModelsList(' gpt-4o, , claude-3 ')).toEqual(['gpt-4o', 'claude-3'])
    expect(parseGroupsList('beta, default,alpha')).toEqual(['default', 'alpha', 'beta'])
    expect(formatModelsString(['a', 'b'])).toBe('a,b')
    expect(formatGroupsString(['x', 'y'])).toBe('x,y')
    expect(validateModels('a,b')).toBe(true)
    expect(validateModels(' , ')).toBe(false)
    expect(validateGroups('default')).toBe(true)
    expect(validateGroups('')).toBe(false)
  })

  it('parses channel settings and validates json strings', () => {
    expect(parseChannelSettings('{"proxy":"http://x"}')).toEqual({ proxy: 'http://x' })
    expect(parseChannelSettings('{bad')).toEqual({})
    expect(parseChannelOtherSettings('{"allow_speed":true}')).toEqual({ allow_speed: true })
    expect(parseChannelOtherSettings('{}')).toEqual({})
    expect(validateChannelSettings('')).toBe(true)
    expect(validateChannelSettings('{"a":1}')).toBe(true)
    expect(validateChannelSettings('{oops')).toBe(false)
  })

  it('formats balances, quota and response times', () => {
    expect(formatBalance(null)).toBe('-')
    expect(formatBalance(12.5)).toBe('$12.5')
    expect(getBalanceVariant(0)).toBe('neutral')
    expect(getBalanceVariant(0.5)).toBe('danger')
    expect(getBalanceVariant(5)).toBe('warning')
    expect(getBalanceVariant(20)).toBe('success')
    expect(formatResponseTime(0)).toBe('Not tested')
    expect(formatResponseTime(250)).toBe('250ms')
    expect(formatResponseTime(1250)).toBe('1.25s')
    expect(formatResponseTime(250, (key, options) => `${key}:${options?.value ?? ''}`)).toBe('{{value}}ms:250')
    expect(formatQuota(500000)).toBe('$1')
    expect(getResponseTimeConfig(0).label).toBe('Not tested')
    expect(getResponseTimeConfig(500).label).toBe('Excellent')
    expect(getResponseTimeConfig(1500).label).toBe('Fair')
  })

  it('formats timestamps and relative time with fallbacks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))
    expect(formatRelativeTime(0)).toBe('Never')
    expect(formatRelativeTime(Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000))).toContain('day')
    expect(formatTimestamp(0)).toBe('N/A')
    expect(formatTimestamp(1704067200)).toBe('2024-01-01 08:00:00')
  })

  it('formats simple displays and validation helpers', () => {
    expect(getPriorityDisplay(undefined)).toBe('0')
    expect(getPriorityDisplay(2)).toBe('2')
    expect(getWeightDisplay(null)).toBe('0')
    expect(getWeightDisplay(8)).toBe('8')
    expect(validateChannelName(' hello ')).toBe(true)
    expect(validateChannelName('   ')).toBe(false)
    expect(validateApiKey(' key ')).toBe(true)
    expect(validateApiKey(' ')).toBe(false)
    expect(getKeyPromptForType(15)).toContain('APIKey|SecretKey')
    expect(getKeyPromptForType(999)).toBe('Enter API key for this channel')
  })

  it('detects channels needing attention and explains the reason', () => {
    expect(channelNeedsAttention(createChannel({ status: 3 }))).toBe(true)
    expect(getAttentionReason(createChannel({ status: 3 }))).toBe('Auto-disabled')
    expect(channelNeedsAttention(createChannel({ balance: 0.2 }))).toBe(true)
    expect(getAttentionReason(createChannel({ balance: 0.2 }))).toBe('Low balance')
    const multiKeyChannel = createChannel({
      channel_info: {
        is_multi_key: true,
        multi_key_size: 2,
        multi_key_status_list: { '0': 2, '1': 3 },
        multi_key_polling_index: 0,
        multi_key_mode: 'polling',
      },
    })
    expect(channelNeedsAttention(multiKeyChannel)).toBe(true)
    expect(getAttentionReason(multiKeyChannel)).toBe('All keys disabled')
    expect(channelNeedsAttention(createChannel({ balance: 0 }))).toBe(false)
    expect(getAttentionReason(createChannel({ balance: 0 }))).toBeNull()
  })

  it('aggregates channels by tag and preserves aggregate semantics', () => {
    const first = createChannel({ id: 1, key: 'a', tag: 'team-a', used_quota: 100, response_time: 100, priority: 1, weight: 5, group: 'default,alpha', status: 2 })
    const second = createChannel({ id: 2, key: 'b', tag: 'team-a', used_quota: 300, response_time: 500, priority: 2, weight: 5, group: 'alpha,beta', status: 1 })
    const third = createChannel({ id: 3, key: 'c', tag: '', used_quota: 50, response_time: 1000, priority: 2, weight: 6, group: 'gamma', status: 2 })
    const result = aggregateChannelsByTag([first, second, third])
    expect(result).toHaveLength(2)
    expect(isTagAggregateRow(result[0])).toBe(true)
    const teamA = result[0]
    if (!isTagAggregateRow(teamA)) throw new Error('expected tag row')
    expect(teamA.children).toEqual([first, second])
    expect(teamA.used_quota).toBe(400)
    expect(teamA.response_time).toBe(300)
    expect(teamA.priority).toBeNull()
    expect(teamA.weight).toBe(5)
    expect(teamA.group).toBe('default,alpha,beta')
    expect(teamA.status).toBe(1)
  })

  it('deduplicates multiline keys while preserving insertion order', () => {
    expect(deduplicateKeys('')).toEqual({
      deduplicatedText: '',
      beforeCount: 0,
      afterCount: 0,
      removedCount: 0,
    })
    expect(deduplicateKeys('key-1\nkey-2\nkey-1\n key-2 \nkey-3')).toEqual({
      deduplicatedText: 'key-1\nkey-2\nkey-3',
      beforeCount: 5,
      afterCount: 3,
      removedCount: 2,
    })
  })
})
