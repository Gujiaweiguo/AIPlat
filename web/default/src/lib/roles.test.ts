import { getRoleLabel, getRoleLabelKey, ROLE } from './roles'

vi.mock('i18next', () => ({
  t: (key: string) => `translated:${key}`,
}))

describe('roles', () => {
  test('exposes stable role constants', () => {
    expect(ROLE.GUEST).toBe(0)
    expect(ROLE.USER).toBe(1)
    expect(ROLE.ADMIN).toBe(10)
    expect(ROLE.SUPER_ADMIN).toBe(100)
  })

  test('getRoleLabelKey returns the matching key or guest fallback', () => {
    expect(getRoleLabelKey(ROLE.ADMIN)).toBe('Admin')
    expect(getRoleLabelKey(999)).toBe('Guest')
    expect(getRoleLabelKey()).toBe('Guest')
  })

  test('getRoleLabel translates the resolved key', () => {
    expect(getRoleLabel(ROLE.SUPER_ADMIN)).toBe('translated:Super Admin')
  })
})
