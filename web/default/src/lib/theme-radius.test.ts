import { renderHook } from '@testing-library/react'
import { resolveThemeRadiusPx, useThemeRadiusPx } from './theme-radius'

describe('theme radius', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('resolveThemeRadiusPx reads numeric radius from computed style', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      borderTopLeftRadius: '12px',
    } as CSSStyleDeclaration)

    expect(resolveThemeRadiusPx('--radius-md')).toBe(12)
  })

  test('resolveThemeRadiusPx returns undefined for invalid radius values', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      borderTopLeftRadius: 'calc(abc)',
    } as CSSStyleDeclaration)

    expect(resolveThemeRadiusPx('--radius-bad')).toBeUndefined()
  })

  test('resolveThemeRadiusPx removes its temporary probe node', () => {
    const initialCount = document.documentElement.children.length
    resolveThemeRadiusPx('--radius-md')

    expect(document.documentElement.children).toHaveLength(initialCount)
  })

  test('useThemeRadiusPx memoizes the resolved value', () => {
    const getComputedStyleMock = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({
        borderTopLeftRadius: '18px',
      } as CSSStyleDeclaration)

    const { result, rerender } = renderHook(
      ({ cssVariable, refreshKey }) => useThemeRadiusPx(cssVariable, refreshKey),
      {
        initialProps: { cssVariable: '--radius-lg', refreshKey: 'a' },
      }
    )

    expect(result.current).toBe(18)

    getComputedStyleMock.mockReturnValue({
      borderTopLeftRadius: '20px',
    } as CSSStyleDeclaration)
    rerender({ cssVariable: '--radius-lg', refreshKey: 'a' })
    expect(result.current).toBe(18)

    rerender({ cssVariable: '--radius-lg', refreshKey: 'b' })
    expect(result.current).toBe(20)
  })
})
