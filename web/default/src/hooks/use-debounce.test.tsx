import { act, renderHook } from '@testing-library/react'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns initial value immediately and updates after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 200 } }
    )

    expect(result.current).toBe('a')

    rerender({ value: 'b', delay: 200 })
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('b')
  })

  test('clears the pending timer when value changes again before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })
    act(() => vi.advanceTimersByTime(100))

    rerender({ value: 'third' })
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('first')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('third')
  })
})
