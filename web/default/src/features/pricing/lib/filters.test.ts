import { describe, expect, it } from 'vitest'
import {
  ENDPOINT_TYPES,
  FILTER_ALL,
  QUOTA_TYPES,
  QUOTA_TYPE_VALUES,
  SORT_OPTIONS,
} from '../constants'
import type { PricingModel } from '../types'
import {
  extractAllTags,
  filterAndSortModels,
  filterByEndpointType,
  filterByGroup,
  filterByQuotaType,
  filterBySearch,
  filterByTag,
  filterByVendor,
  parseTags,
  sortModels,
} from './filters'

const models: PricingModel[] = [
  {
    id: 1,
    model_name: 'Alpha',
    description: 'Fast model',
    vendor_name: 'OpenAI',
    quota_type: QUOTA_TYPE_VALUES.TOKEN,
    model_ratio: 2,
    completion_ratio: 1,
    enable_groups: ['default'],
    tags: 'chat,featured',
    supported_endpoint_types: [ENDPOINT_TYPES.OPENAI],
  },
  {
    id: 2,
    model_name: 'Beta',
    description: 'Image specialist',
    vendor_name: 'Anthropic',
    quota_type: QUOTA_TYPE_VALUES.REQUEST,
    model_ratio: 1,
    model_price: 5,
    completion_ratio: 1,
    enable_groups: ['vip'],
    tags: 'image;featured',
    supported_endpoint_types: [ENDPOINT_TYPES.IMAGE_GENERATION],
  },
  {
    id: 3,
    model_name: 'Gamma',
    description: 'Reasoning model',
    vendor_name: 'OpenAI',
    quota_type: QUOTA_TYPE_VALUES.TOKEN,
    model_ratio: 3,
    completion_ratio: 1,
    enable_groups: ['default', 'vip'],
    tags: 'reasoning | chat',
    supported_endpoint_types: [ENDPOINT_TYPES.OPENAI, ENDPOINT_TYPES.OPENAI_RESPONSE],
  },
]

describe('filters', () => {
  it('filters by search, vendor, group, quota and endpoint type', () => {
    expect(filterBySearch(models, 'image').map((item) => item.id)).toEqual([2])
    expect(filterByVendor(models, 'OpenAI').map((item) => item.id)).toEqual([1, 3])
    expect(filterByVendor(models, FILTER_ALL)).toBe(models)
    expect(filterByGroup(models, 'vip').map((item) => item.id)).toEqual([2, 3])
    expect(filterByQuotaType(models, QUOTA_TYPES.TOKEN).map((item) => item.id)).toEqual([1, 3])
    expect(filterByEndpointType(models, ENDPOINT_TYPES.IMAGE_GENERATION).map((item) => item.id)).toEqual([2])
  })

  it('sorts models by name and effective price', () => {
    expect(sortModels(models, SORT_OPTIONS.NAME).map((item) => item.model_name)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(sortModels(models, SORT_OPTIONS.PRICE_LOW).map((item) => item.id)).toEqual([1, 3, 2])
    expect(sortModels(models, SORT_OPTIONS.PRICE_HIGH).map((item) => item.id)).toEqual([2, 3, 1])
  })

  it('parses tags, extracts unique tags and filters by tag', () => {
    expect(parseTags('chat, featured;reasoning | image')).toEqual(['chat', 'featured', 'reasoning', 'image'])
    expect(parseTags()).toEqual([])
    expect(extractAllTags(models)).toEqual(['chat', 'featured', 'image', 'reasoning'])
    expect(filterByTag(models, 'CHAT').map((item) => item.id)).toEqual([1, 3])
    expect(filterByTag(models, FILTER_ALL)).toBe(models)
  })

  it('applies all filters together and sorts the final list', () => {
    const result = filterAndSortModels(models, {
      search: 'model',
      vendor: 'OpenAI',
      group: 'default',
      quotaType: QUOTA_TYPES.TOKEN,
      endpointType: ENDPOINT_TYPES.OPENAI,
      tag: 'chat',
      sortBy: SORT_OPTIONS.PRICE_HIGH,
    })
    expect(result.map((item) => item.id)).toEqual([3, 1])
  })

  it('returns an empty list when tag is absent', () => {
    expect(filterByTag(models, 'missing')).toEqual([])
  })
})
