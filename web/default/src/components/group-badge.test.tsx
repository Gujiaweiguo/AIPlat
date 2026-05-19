import { fireEvent, render, screen } from '@testing-library/react'
import { GroupBadge } from './group-badge'

const copyToClipboard = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/hooks/use-copy-to-clipboard', () => ({
  useCopyToClipboard: () => ({
    copyToClipboard,
  }),
}))

describe('GroupBadge', () => {
  beforeEach(() => {
    copyToClipboard.mockReset()
  })

  test('renders default label for empty groups', () => {
    render(<GroupBadge group='' />)

    expect(screen.getByText('User Group')).toBeInTheDocument()
  })

  test('renders Auto label for auto groups', () => {
    render(<GroupBadge group='auto' />)

    expect(screen.getByText('Auto')).toBeInTheDocument()
  })

  test('renders ratio badge with warning style when ratio is above one', () => {
    render(<GroupBadge group='vip' ratio={1.5} />)

    expect(screen.getByText('1.5x')).toBeInTheDocument()
    expect(screen.getByText('1.5x').parentElement).toHaveClass('text-warning')
  })

  test('copies label text when badge is clicked and copyable is enabled', () => {
    render(<GroupBadge group='vip' copyable />)

    fireEvent.click(screen.getByText('vip'))
    expect(copyToClipboard).toHaveBeenCalledWith('vip')
  })
})
