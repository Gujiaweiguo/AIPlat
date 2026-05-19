import { act, renderHook } from '@testing-library/react'
import defaultUseDialogState, { useDialog, useDialogState, useDialogs } from './use-dialog'

describe('use-dialog hooks', () => {
  test('useDialog opens, toggles, and closes a single dialog', () => {
    const { result } = renderHook(() => useDialog())

    expect(result.current[0]).toBe(false)

    act(() => result.current[1].open())
    expect(result.current[0]).toBe(true)

    act(() => result.current[1].toggle())
    expect(result.current[0]).toBe(false)

    act(() => result.current[1].close())
    expect(result.current[0]).toBe(false)
  })

  test('useDialogState tracks stateful dialog values and reset behavior', () => {
    const { result } = renderHook(() => useDialogState<string>())

    expect(result.current[2].isOpen).toBe(false)

    act(() => result.current[1]('edit'))
    expect(result.current[0]).toBe('edit')
    expect(result.current[2].isOpen).toBe(true)

    act(() => result.current[2].reset())
    expect(result.current[0]).toBeNull()
    expect(result.current[2].isOpen).toBe(false)
  })

  test('default export remains useDialogState', () => {
    expect(defaultUseDialogState).toBe(useDialogState)
  })

  test('useDialogs manages multiple independent dialog keys', () => {
    const { result } = renderHook(() => useDialogs<'create' | 'delete'>())

    act(() => result.current.open('create'))
    expect(result.current.isOpen('create')).toBe(true)
    expect(result.current.hasAnyOpen).toBe(true)

    act(() => result.current.toggle('delete'))
    expect(result.current.isOpen('delete')).toBe(true)

    act(() => result.current.close('create'))
    expect(result.current.isOpen('create')).toBe(false)

    act(() => result.current.closeAll())
    expect(result.current.hasAnyOpen).toBe(false)
  })
})
