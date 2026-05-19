import {
  formatDateStr,
  formatDateTimeStr,
  formatNumber,
  formatPercent,
  formatTimeStr,
  formatTimestamp,
  formatTimestampForInput,
  formatTimestampToDate,
  formatTokens,
  formatUseTime,
  parseTimestampFromInput,
  stringToColor,
} from './format'

describe('format helpers', () => {
  const sampleDate = new Date(2024, 0, 2, 3, 4, 0)
  const sampleTimestampSeconds = Math.floor(sampleDate.getTime() / 1000)

  test('formatNumber handles nullish and numeric values', () => {
    expect(formatNumber(null)).toBe('-')
    expect(formatNumber(1234.567)).toBe('1,234.57')
  })

  test('formatPercent renders percent values and handles missing data', () => {
    expect(formatPercent(undefined)).toBe('-')
    expect(formatPercent(12.5)).toBe('12.5%')
  })

  test('formatTimestamp returns Never sentinel', () => {
    expect(formatTimestamp(-1)).toBe('Never')
  })

  test('formatTimestampToDate handles missing timestamps', () => {
    expect(formatTimestampToDate()).toBe('-')
    expect(formatTimestampToDate(0)).toBe('-')
  })

  test('date and time formatters produce expected output', () => {
    expect(formatDateTimeStr(sampleDate)).toBe('2024-01-02 03:04:00')
    expect(formatDateStr(sampleDate)).toBe('2024-01-02')
    expect(formatTimeStr(sampleDate)).toBe('03:04:00')
  })

  test('formatTokens handles zero, thousands, and millions', () => {
    expect(formatTokens(0)).toBe('-')
    expect(formatTokens(999)).toBe('999')
    expect(formatTokens(1250)).toBe('1.3K')
    expect(formatTokens(1500000)).toBe('1.50M')
  })

  test('formatUseTime uses seconds or minute format based on duration', () => {
    expect(formatUseTime(12.34)).toBe('12.3s')
    expect(formatUseTime(125)).toBe('2m 5s')
  })

  test('formatTimestampForInput and parseTimestampFromInput convert values symmetrically', () => {
    expect(formatTimestampForInput(-1)).toBe('')
    expect(formatTimestampForInput(sampleTimestampSeconds)).toBe('2024-01-02T03:04')
    expect(parseTimestampFromInput('2024-01-02T03:04')).toBe(
      sampleTimestampSeconds
    )
    expect(parseTimestampFromInput('')).toBe(-1)
  })

  test('stringToColor returns a stable hsl string', () => {
    expect(stringToColor('alpha')).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
    expect(stringToColor('alpha')).toBe(stringToColor('alpha'))
    expect(stringToColor('')).toBe('gray')
  })
})
