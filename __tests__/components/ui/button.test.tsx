import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
    it('renders with default variant', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeInTheDocument()
    })

    it('renders with destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>)
        const button = screen.getByRole('button', { name: /delete/i })
        expect(button).toBeInTheDocument()
    })

    it('renders with outline variant', () => {
        render(<Button variant="outline">Outline</Button>)
        const button = screen.getByRole('button', { name: /outline/i })
        expect(button).toBeInTheDocument()
    })

    it('renders as disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        const button = screen.getByRole('button', { name: /disabled/i })
        expect(button).toBeDisabled()
    })

    it('calls onClick handler when clicked', async () => {
        const handleClick = vi.fn()
        render(<Button onClick={handleClick}>Click</Button>)
        const button = screen.getByRole('button', { name: /click/i })

        button.click()
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders with different sizes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>)
        expect(screen.getByRole('button', { name: /small/i })).toBeInTheDocument()

        rerender(<Button size="lg">Large</Button>)
        expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument()
    })
})
