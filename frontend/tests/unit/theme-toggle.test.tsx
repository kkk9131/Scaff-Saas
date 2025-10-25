import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const renderToggle = () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.documentElement.dataset.theme = ''
    window.localStorage.clear()

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('toggles between light and dark modes', async () => {
    renderToggle()

    const button = await screen.findByRole('button', { name: 'ダークモードに切り替え' })
    fireEvent.click(button)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('scaffai-theme-preference')).toBe('dark')

    const darkButton = await screen.findByRole('button', { name: 'ライトモードに切り替え' })
    fireEvent.click(darkButton)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('scaffai-theme-preference')).toBe('light')
  })
})
