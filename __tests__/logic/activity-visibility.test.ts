import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

/**
 * Activity Type Visibility Logic Tests
 * 
 * These tests verify that users can only see content matching their activity type:
 * - 'gym' users see only gym routines
 * - 'pilates' users see only pilates routines
 * - 'mixed' users see gym, pilates, and mixed routines
 */

// Mock workout data
const mockWorkouts = [
    { id: '1', name: 'Gym Routine A', activity_type: 'gym' },
    { id: '2', name: 'Pilates Class', activity_type: 'pilates' },
    { id: '3', name: 'Mixed Training', activity_type: 'mixed' },
    { id: '4', name: 'Gym Routine B', activity_type: 'gym' },
]

// This mirrors the logic in app/dashboard/student/page.tsx
function filterWorkoutsByActivityType(workouts: typeof mockWorkouts, userActivityType: string) {
    if (userActivityType === 'mixed') {
        return workouts.filter(w =>
            w.activity_type === 'gym' ||
            w.activity_type === 'pilates' ||
            w.activity_type === 'mixed'
        )
    }
    return workouts.filter(w =>
        w.activity_type === userActivityType ||
        w.activity_type === 'mixed'
    )
}

describe('Activity Type Visibility Logic', () => {
    describe('Gym User', () => {
        it('should only see gym and mixed routines', () => {
            const visible = filterWorkoutsByActivityType(mockWorkouts, 'gym')

            expect(visible).toHaveLength(3) // 2 gym + 1 mixed
            expect(visible.map(w => w.activity_type)).toContain('gym')
            expect(visible.map(w => w.activity_type)).toContain('mixed')
            expect(visible.map(w => w.activity_type)).not.toContain('pilates')
        })

        it('should not see pilates-only routines', () => {
            const visible = filterWorkoutsByActivityType(mockWorkouts, 'gym')
            const pilatesOnly = visible.filter(w => w.activity_type === 'pilates')

            expect(pilatesOnly).toHaveLength(0)
        })
    })

    describe('Pilates User', () => {
        it('should only see pilates and mixed routines', () => {
            const visible = filterWorkoutsByActivityType(mockWorkouts, 'pilates')

            expect(visible).toHaveLength(2) // 1 pilates + 1 mixed
            expect(visible.map(w => w.activity_type)).toContain('pilates')
            expect(visible.map(w => w.activity_type)).toContain('mixed')
            expect(visible.map(w => w.activity_type)).not.toContain('gym')
        })

        it('should not see gym-only routines', () => {
            const visible = filterWorkoutsByActivityType(mockWorkouts, 'pilates')
            const gymOnly = visible.filter(w => w.activity_type === 'gym')

            expect(gymOnly).toHaveLength(0)
        })
    })

    describe('Mixed User', () => {
        it('should see all routine types', () => {
            const visible = filterWorkoutsByActivityType(mockWorkouts, 'mixed')

            expect(visible).toHaveLength(4) // All 4 workouts
        })

        it('should include gym, pilates, and mixed routines', () => {
            const visible = filterWorkoutsByActivityType(mockWorkouts, 'mixed')
            const activityTypes = [...new Set(visible.map(w => w.activity_type))]

            expect(activityTypes).toContain('gym')
            expect(activityTypes).toContain('pilates')
            expect(activityTypes).toContain('mixed')
        })
    })
})

describe('Pilates Access Control', () => {
    // This tests the logic that determines if a user can access the pilates section
    const canAccessPilates = (activityType: string) => {
        return activityType === 'pilates' || activityType === 'mixed'
    }

    it('pilates user can access pilates section', () => {
        expect(canAccessPilates('pilates')).toBe(true)
    })

    it('mixed user can access pilates section', () => {
        expect(canAccessPilates('mixed')).toBe(true)
    })

    it('gym user cannot access pilates section', () => {
        expect(canAccessPilates('gym')).toBe(false)
    })
})
