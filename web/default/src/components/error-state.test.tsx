import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorState } from './error-state'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('./page-transition', () => ({
  FadeIn: (props: { children: ReactNode }) => <>{props.children}</>,
}))

describe('ErrorState', () => {
  test('renders translated default title', () => {
    render(<ErrorState />)

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
  })

  test('renders retry button only when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('renders custom action content', () => {
    render(<ErrorState action={<a href='/status'>Status Page</a>} />)

    expect(screen.getByRole('link', { name: 'Status Page' })).toBeInTheDocument()
  })
})
