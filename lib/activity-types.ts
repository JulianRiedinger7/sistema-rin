/**
 * Central source of truth for all activity types in the system.
 * Any changes to activities should ONLY be made here.
 */

export const ACTIVITY_TYPES = [
    { value: 'gym', label: 'Gimnasio' },
    { value: 'pilates_8', label: 'Pilates 8' },
    { value: 'pilates_12', label: 'Pilates 12' },
    { value: 'mixed_8', label: 'Mixto 8 (Gym + Pilates 8)' },
    { value: 'mixed_12', label: 'Mixto 12 (Gym + Pilates 12)' },
    { value: 'trial', label: 'Semana de Prueba' },
] as const

/** Activity values used in forms and the database */
export type ActivityType = typeof ACTIVITY_TYPES[number]['value']

/** All valid activity type string values */
export const ACTIVITY_VALUES = ACTIVITY_TYPES.map(a => a.value) as unknown as [string, ...string[]]

/** Map from value to label for quick lookups */
export const ACTIVITY_LABELS: Record<string, string> = Object.fromEntries(
    ACTIVITY_TYPES.map(a => [a.value, a.label])
)

/** Get the human-readable label for an activity type */
export function getActivityLabel(type: string): string {
    return ACTIVITY_LABELS[type] || type || '-'
}

/** Activity types that include pilates access */
export function hasPilatesAccess(type: string): boolean {
    return ['pilates_8', 'pilates_12', 'mixed_8', 'mixed_12'].includes(type)
}

/** Activity types that include gym access */
export function hasGymAccess(type: string): boolean {
    return ['gym', 'mixed_8', 'mixed_12', 'trial'].includes(type)
}

/** Check if the type is any variation of "mixed" */
export function isMixedType(type: string): boolean {
    return ['mixed_8', 'mixed_12'].includes(type)
}

/** Short labels for compact displays (tables, badges) */
export const ACTIVITY_SHORT_LABELS: Record<string, string> = {
    'gym': 'Gimnasio',
    'pilates_8': 'Pilates 8',
    'pilates_12': 'Pilates 12',
    'mixed_8': 'Mixto 8',
    'mixed_12': 'Mixto 12',
    'trial': 'Prueba',
}

export function getActivityShortLabel(type: string): string {
    return ACTIVITY_SHORT_LABELS[type] || type || '-'
}
