import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
    it('renders with default variant', () => {
        render(<Badge>Default</Badge>)
        expect(screen.getByText('Default')).toBeInTheDocument()
    })

    it('renders with secondary variant', () => {
        render(<Badge variant="secondary">Secondary</Badge>)
        expect(screen.getByText('Secondary')).toBeInTheDocument()
    })

    it('renders with destructive variant', () => {
        render(<Badge variant="destructive">Error</Badge>)
        expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('renders with outline variant', () => {
        render(<Badge variant="outline">Outlined</Badge>)
        expect(screen.getByText('Outlined')).toBeInTheDocument()
    })

    it('applies custom className', () => {
        render(<Badge className="custom-class">Custom</Badge>)
        const badge = screen.getByText('Custom')
        expect(badge).toHaveClass('custom-class')
    })
})
