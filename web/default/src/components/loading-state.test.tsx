import { render, screen } from '@testing-library/react'
import { LoadingState } from './loading-state'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('LoadingState', () => {
  test('renders default translated message in block mode', () => {
    render(<LoadingState />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('renders inline layout with custom message', () => {
    const { container } = render(<LoadingState inline message='Saving changes' />)

    expect(screen.getByText('Saving changes')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('inline-flex')
  })

  test('applies large icon sizing when requested', () => {
    const { container } = render(<LoadingState size='lg' message='Loading large' />)

    expect(container.querySelector('.size-8')).toBeInTheDocument()
  })
})
