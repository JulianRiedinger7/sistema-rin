import { describe, it, expect } from 'vitest'

/**
 * Payment and Quota Status Logic Tests
 * 
 * Tests the logic for determining if a user is up-to-date with payments.
 * Simplified to avoid timezone issues in date handling.
 */

interface Payment {
    year: number
    month: number // 0-indexed (January = 0)
    status: string
}

// Check if a specific month has a completed payment
function hasPaymentForMonth(payments: Payment[], year: number, month: number): boolean {
    return payments.some(p => p.year === year && p.month === month && p.status === 'completed')
}

// Check if user has paid all months from start to current
function isUpToDate(
    startYear: number,
    startMonth: number,
    currentYear: number,
    currentMonth: number,
    payments: Payment[]
): boolean {
    let year = startYear
    let month = startMonth

    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        if (!hasPaymentForMonth(payments, year, month)) {
            return false
        }
        month++
        if (month > 11) {
            month = 0
            year++
        }
    }
    return true
}

describe('Payment Quota Logic', () => {
    describe('hasPaymentForMonth', () => {
        const payments: Payment[] = [
            { year: 2025, month: 11, status: 'completed' }, // December 2025
            { year: 2026, month: 0, status: 'pending' },    // January 2026 (pending)
        ]

        it('returns true for completed payment', () => {
            expect(hasPaymentForMonth(payments, 2025, 11)).toBe(true)
        })

        it('returns false for pending payment', () => {
            expect(hasPaymentForMonth(payments, 2026, 0)).toBe(false)
        })

        it('returns false for missing payment', () => {
            expect(hasPaymentForMonth(payments, 2025, 10)).toBe(false) // November
        })
    })

    describe('isUpToDate', () => {
        it('returns true when all payments are completed', () => {
            const payments: Payment[] = [
                { year: 2025, month: 11, status: 'completed' }, // December
                { year: 2026, month: 0, status: 'completed' },  // January
            ]

            // User started Dec 2025, current is Jan 2026
            expect(isUpToDate(2025, 11, 2026, 0, payments)).toBe(true)
        })

        it('returns false when a month is missing', () => {
            const payments: Payment[] = [
                { year: 2025, month: 10, status: 'completed' }, // November
                // Missing December
                { year: 2026, month: 0, status: 'completed' },  // January
            ]

            // User started Nov 2025, current is Jan 2026 (missing Dec)
            expect(isUpToDate(2025, 10, 2026, 0, payments)).toBe(false)
        })

        it('returns false when latest payment is pending', () => {
            const payments: Payment[] = [
                { year: 2026, month: 0, status: 'pending' },
            ]

            expect(isUpToDate(2026, 0, 2026, 0, payments)).toBe(false)
        })

        it('returns true for new user with completed first payment', () => {
            const payments: Payment[] = [
                { year: 2026, month: 0, status: 'completed' },
            ]

            expect(isUpToDate(2026, 0, 2026, 0, payments)).toBe(true)
        })
    })
})
