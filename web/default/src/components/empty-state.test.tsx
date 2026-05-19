import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './empty-state'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('./page-transition', () => ({
  FadeIn: (props: { children: ReactNode }) => <>{props.children}</>,
}))

describe('EmptyState', () => {
  test('renders default empty copy', () => {
    render(<EmptyState />)

    expect(screen.getByText('No Data')).toBeInTheDocument()
  })

  test('renders description, action, and optional border styling', () => {
    render(
      <EmptyState
        description='Nothing to see here'
        action={<button type='button'>Reload</button>}
        bordered
      />
    )

    expect(screen.getByText('Nothing to see here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    expect(
      screen.getByText('No Data').closest('[data-slot="empty"]')
    ).toHaveClass('border')
  })
})
