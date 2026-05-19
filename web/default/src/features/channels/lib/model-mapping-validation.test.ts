import { describe, expect, it } from 'vitest'
import {
  categorizeModelsWithRedirect,
  extractMappingSourceModels,
  extractRedirectModels,
  findExposedTargetModels,
  findMissingModelsInMapping,
  formatModelsArray,
  hasModelConfigChanged,
  normalizeModelName,
  parseModelsString,
  validateModelMappingJson,
} from './model-mapping-validation'

describe('model-mapping-validation', () => {
  it('parses, formats and normalizes model names', () => {
    expect(parseModelsString(' gpt-4o, ,claude-3 ')).toEqual(['gpt-4o', 'claude-3'])
    expect(parseModelsString('')).toEqual([])
    expect(formatModelsArray(['a', 'b', 'a'])).toBe('a,b')
    expect(normalizeModelName(' gpt-4o ')).toBe('gpt-4o')
    expect(normalizeModelName('')).toBe('')
  })

  it('extracts source and redirect models from valid json only', () => {
    const mapping = '{" gpt-4o ":" turbo ","gpt-4o":"turbo","claude":" sonnet "}'
    expect(extractMappingSourceModels(mapping)).toEqual(['gpt-4o', 'claude'])
    expect(extractRedirectModels(mapping)).toEqual(['turbo', 'sonnet'])
    expect(extractMappingSourceModels('[]')).toEqual([])
    expect(extractRedirectModels('{bad')).toEqual([])
  })

  it('detects model config changes across arrays and mapping strings', () => {
    expect(hasModelConfigChanged(['a'], '', [], '')).toBe(true)
    expect(hasModelConfigChanged(['a'], ' {"x":"y"} ', ['a'], '{"x":"y"}')).toBe(false)
    expect(hasModelConfigChanged(['a', 'b'], '', ['a'], '')).toBe(true)
    expect(hasModelConfigChanged(['a'], '', ['b'], '')).toBe(true)
    expect(hasModelConfigChanged(['a'], '{"x":"y2"}', ['a'], '{"x":"y"}')).toBe(true)
  })

  it('finds missing and exposed models from mapping definitions', () => {
    expect(findMissingModelsInMapping('{"gpt-4o":"turbo"," claude ":"sonnet"}', ['gpt-4o'])).toEqual(['claude'])
    expect(findMissingModelsInMapping('[]', ['gpt-4o'])).toEqual([])
    expect(findExposedTargetModels('{"gpt-4o":" turbo ","claude":"sonnet"}', ['turbo', 'claude'])).toEqual(['turbo'])
    expect(findExposedTargetModels('', ['turbo'])).toEqual([])
  })

  it('deduplicates missing models after normalization', () => {
    expect(
      findMissingModelsInMapping('{" gpt-4o ":"a","gpt-4o":"b","claude":"c"}', ['gpt-4o'])
    ).toEqual(['claude'])
  })

  it('validates mapping json structure and categorizes model sets', () => {
    expect(validateModelMappingJson('')).toEqual({ valid: true })
    expect(validateModelMappingJson('{"a":"b"}')).toEqual({ valid: true })
    expect(validateModelMappingJson('[]')).toEqual({
      valid: false,
      error: 'Model mapping must be a valid JSON object',
    })
    expect(validateModelMappingJson('{bad')).toEqual({
      valid: false,
      error: 'Model mapping must be valid JSON format',
    })

    const categorized = categorizeModelsWithRedirect([' gpt-4o ', 'claude'], ['turbo', ' claude '])
    expect(Array.from(categorized.normalizedCurrentModels)).toEqual(['gpt-4o', 'claude'])
    expect(Array.from(categorized.normalizedRedirectModels)).toEqual(['turbo', 'claude'])
    expect(Array.from(categorized.classificationSet)).toEqual(['gpt-4o', 'claude', 'turbo'])
    expect(Array.from(categorized.redirectOnlySet)).toEqual(['turbo'])
  })
})
