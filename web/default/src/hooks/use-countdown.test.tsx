import { act, renderHook } from '@testing-library/react'
import { useCountdown } from './use-countdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts manually and counts down each second', () => {
    const { result } = renderHook(() => useCountdown({ initialSeconds: 3 }))

    act(() => result.current.start())
    expect(result.current.isActive).toBe(true)
    expect(result.current.secondsLeft).toBe(3)

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.secondsLeft).toBe(2)
  })

  test('resets to initial seconds after reaching zero', () => {
    const { result } = renderHook(() => useCountdown({ initialSeconds: 2 }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current.isActive).toBe(false)
    expect(result.current.secondsLeft).toBe(2)
  })

  test('stop deactivates countdown without resetting remaining seconds', () => {
    const { result } = renderHook(() => useCountdown({ initialSeconds: 4 }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(1000))
    act(() => result.current.stop())

    expect(result.current.isActive).toBe(false)
    expect(result.current.secondsLeft).toBe(3)
  })

  test('reset stops countdown and restores initial state', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 5, autoStart: true })
    )

    act(() => result.current.reset())

    expect(result.current.isActive).toBe(false)
    expect(result.current.secondsLeft).toBe(5)
  })
})
