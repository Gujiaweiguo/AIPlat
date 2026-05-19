import {
  cn,
  getPageNumbers,
  sanitizeCssVariableName,
  truncateText,
  tryPrettyJson,
} from './utils'

describe('utils', () => {
  test('cn merges tailwind classes with later values winning', () => {
    expect(cn('px-2 py-1', 'px-4', undefined)).toBe('py-1 px-4')
  })

  test('sanitizeCssVariableName replaces separators and strips invalid chars', () => {
    expect(sanitizeCssVariableName('gpt-3.5 / turbo!')).toBe('gpt-3-5---turbo')
  })

  test('getPageNumbers returns all pages for small datasets', () => {
    expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  test('getPageNumbers returns beginning range with ellipsis', () => {
    expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, 4, '...', 10])
  })

  test('getPageNumbers returns middle range with ellipses', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10])
  })

  test('getPageNumbers returns ending range with ellipsis', () => {
    expect(getPageNumbers(9, 10)).toEqual([1, '...', 7, 8, 9, 10])
  })

  test('truncateText returns original text when under limit', () => {
    expect(truncateText('short', 10)).toBe('short')
  })

  test('truncateText adds ellipsis when over limit', () => {
    expect(truncateText('abcdefghij', 5)).toBe('abcde...')
  })

  test('tryPrettyJson pretty-prints valid json', () => {
    expect(tryPrettyJson('{"a":1,"b":[2]}')).toBe(`{
  "a": 1,
  "b": [
    2
  ]
}`)
  })

  test('tryPrettyJson returns trimmed raw text for invalid json', () => {
    expect(tryPrettyJson('  not-json  ')).toBe('not-json')
  })
})
