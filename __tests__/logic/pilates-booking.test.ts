import { describe, it, expect } from 'vitest'

/**
 * Pilates Booking Logic Tests
 * 
 * Tests the rules for pilates class bookings.
 */

interface Booking {
    user_id: string
    date: string
    hour: number
}

const MAX_CAPACITY = 4

function getSlotCount(bookings: Booking[], date: string, hour: number): number {
    return bookings.filter(b => b.date === date && b.hour === hour).length
}

function isSlotFull(bookings: Booking[], date: string, hour: number): boolean {
    return getSlotCount(bookings, date, hour) >= MAX_CAPACITY
}

function isUserBooked(bookings: Booking[], userId: string, date: string, hour: number): boolean {
    return bookings.some(b => b.user_id === userId && b.date === date && b.hour === hour)
}

function canUserBook(bookings: Booking[], userId: string, date: string, hour: number): boolean {
    if (isSlotFull(bookings, date, hour)) return false
    if (isUserBooked(bookings, userId, date, hour)) return false
    return true
}

describe('Pilates Booking Logic', () => {
    const mockBookings: Booking[] = [
        { user_id: 'user1', date: '2026-01-25', hour: 10 },
        { user_id: 'user2', date: '2026-01-25', hour: 10 },
        { user_id: 'user3', date: '2026-01-25', hour: 10 },
        { user_id: 'user4', date: '2026-01-25', hour: 10 }, // Slot is now full
        { user_id: 'user1', date: '2026-01-25', hour: 11 }, // Different hour
    ]

    describe('getSlotCount', () => {
        it('returns correct count for a full slot', () => {
            expect(getSlotCount(mockBookings, '2026-01-25', 10)).toBe(4)
        })

        it('returns 1 for a slot with one booking', () => {
            expect(getSlotCount(mockBookings, '2026-01-25', 11)).toBe(1)
        })

        it('returns 0 for an empty slot', () => {
            expect(getSlotCount(mockBookings, '2026-01-25', 12)).toBe(0)
        })
    })

    describe('isSlotFull', () => {
        it('returns true when slot has 4 bookings', () => {
            expect(isSlotFull(mockBookings, '2026-01-25', 10)).toBe(true)
        })

        it('returns false when slot has less than 4 bookings', () => {
            expect(isSlotFull(mockBookings, '2026-01-25', 11)).toBe(false)
        })
    })

    describe('isUserBooked', () => {
        it('returns true when user has a booking for that slot', () => {
            expect(isUserBooked(mockBookings, 'user1', '2026-01-25', 10)).toBe(true)
        })

        it('returns false when user has no booking for that slot', () => {
            expect(isUserBooked(mockBookings, 'user5', '2026-01-25', 10)).toBe(false)
        })
    })

    describe('canUserBook', () => {
        it('returns false when slot is full', () => {
            expect(canUserBook(mockBookings, 'user5', '2026-01-25', 10)).toBe(false)
        })

        it('returns false when user already has a booking', () => {
            expect(canUserBook(mockBookings, 'user1', '2026-01-25', 11)).toBe(false)
        })

        it('returns true when slot is available and user has no booking', () => {
            expect(canUserBook(mockBookings, 'user5', '2026-01-25', 11)).toBe(true)
        })

        it('returns true for completely empty slot', () => {
            expect(canUserBook(mockBookings, 'user1', '2026-01-25', 12)).toBe(true)
        })
    })
})

describe('Pilates Time Slot Configuration', () => {
    interface TimeConfig {
        morning_start: number
        morning_end: number
        afternoon_start: number
        afternoon_end: number
    }

    function isValidHour(config: TimeConfig, hour: number): boolean {
        const inMorning = hour >= config.morning_start && hour < config.morning_end
        const inAfternoon = hour >= config.afternoon_start && hour < config.afternoon_end
        return inMorning || inAfternoon
    }

    const defaultConfig: TimeConfig = {
        morning_start: 7,
        morning_end: 12,
        afternoon_start: 16,
        afternoon_end: 21,
    }

    it('validates morning hours correctly', () => {
        expect(isValidHour(defaultConfig, 7)).toBe(true)
        expect(isValidHour(defaultConfig, 11)).toBe(true)
        expect(isValidHour(defaultConfig, 12)).toBe(false) // End is exclusive
    })

    it('validates afternoon hours correctly', () => {
        expect(isValidHour(defaultConfig, 16)).toBe(true)
        expect(isValidHour(defaultConfig, 20)).toBe(true)
        expect(isValidHour(defaultConfig, 21)).toBe(false)
    })

    it('rejects gap hours', () => {
        expect(isValidHour(defaultConfig, 13)).toBe(false)
        expect(isValidHour(defaultConfig, 14)).toBe(false)
        expect(isValidHour(defaultConfig, 15)).toBe(false)
    })
})
