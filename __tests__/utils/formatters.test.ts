import { describe, it, expect } from 'vitest'
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns'

describe('Date Formatting Utilities', () => {
    it('should format a date string correctly', () => {
        const dateStr = '2026-01-25'
        const parsed = parseISO(dateStr)
        const formatted = format(parsed, 'dd/MM/yyyy')
        expect(formatted).toBe('25/01/2026')
    })

    it('should calculate start and end of week correctly', () => {
        const date = parseISO('2026-01-25') // Sunday
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 }) // Sunday

        expect(format(weekStart, 'yyyy-MM-dd')).toBe('2026-01-19')
        expect(format(weekEnd, 'yyyy-MM-dd')).toBe('2026-01-25')
    })

    it('should add days correctly', () => {
        const date = parseISO('2026-01-25')
        const plusFive = addDays(date, 5)
        expect(format(plusFive, 'yyyy-MM-dd')).toBe('2026-01-30')
    })
})

describe('Time Duration Formatting', () => {
    const formatDuration = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    it('should format 0 seconds as 00:00:00', () => {
        expect(formatDuration(0)).toBe('00:00:00')
    })

    it('should format 90 seconds as 00:01:30', () => {
        expect(formatDuration(90)).toBe('00:01:30')
    })

    it('should format 3661 seconds as 01:01:01', () => {
        expect(formatDuration(3661)).toBe('01:01:01')
    })

    it('should handle large values correctly', () => {
        expect(formatDuration(7200)).toBe('02:00:00') // 2 hours
    })
})
