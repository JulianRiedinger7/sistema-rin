/**
 * Central source of truth for all activity types in the system.
 * 
 * Model: 4 base types + pilates_weekly_classes (1, 2, or 3)
 * - gym: Solo gimnasio
 * - pilates: Solo pilates (1/2/3 clases semanales = 4/8/12 mensuales)
 * - mixed: Gimnasio + Pilates (1/2/3 clases semanales)
 * - trial: Semana de prueba
 * 
 * Pricing: Each combination has its own fixed price (NOT calculated).
 * Price keys: gym, pilates_1, pilates_2, pilates_3, mixed_1, mixed_2, mixed_3
 */

export const ACTIVITY_TYPES = [
    { value: 'gym', label: 'Gimnasio' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'mixed', label: 'Mixto (Gym + Pilates)' },
    { value: 'trial', label: 'Semana de Prueba' },
] as const

export type ActivityType = typeof ACTIVITY_TYPES[number]['value']

export const ACTIVITY_VALUES = ACTIVITY_TYPES.map(a => a.value) as unknown as [string, ...string[]]

export const ACTIVITY_LABELS: Record<string, string> = Object.fromEntries(
    ACTIVITY_TYPES.map(a => [a.value, a.label])
)

/** Weekly class options for Pilates */
export const PILATES_CLASS_OPTIONS = [
    { value: 1, label: '1 clase/semana (4 clases/mes)' },
    { value: 2, label: '2 clases/semana (8 clases/mes)' },
    { value: 3, label: '3 clases/semana (12 clases/mes)' },
] as const

/**
 * All price items that the admin can configure.
 * Each has a unique key stored in the activity_prices table.
 */
export const PRICE_ITEMS = [
    { key: 'gym', label: 'Gimnasio', group: 'Gimnasio', description: 'Cuota mensual solo gimnasio' },
    { key: 'pilates_1', label: 'Pilates 4 clases/mes', group: 'Pilates', description: 'Pack 4 clases mensuales (1x/semana)' },
    { key: 'pilates_2', label: 'Pilates 8 clases/mes', group: 'Pilates', description: 'Pack 8 clases mensuales (2x/semana)' },
    { key: 'pilates_3', label: 'Pilates 12 clases/mes', group: 'Pilates', description: 'Pack 12 clases mensuales (3x/semana)' },
    { key: 'mixed_1', label: 'Gym + Pilates 4 clases/mes', group: 'Mixto', description: 'Gimnasio + 4 clases de pilates mensuales' },
    { key: 'mixed_2', label: 'Gym + Pilates 8 clases/mes', group: 'Mixto', description: 'Gimnasio + 8 clases de pilates mensuales' },
    { key: 'mixed_3', label: 'Gym + Pilates 12 clases/mes', group: 'Mixto', description: 'Gimnasio + 12 clases de pilates mensuales' },
] as const

/**
 * Build the price lookup key from activity_type + pilates_weekly_classes.
 * Examples: 'gym', 'pilates_2', 'mixed_3'
 */
export function getPriceKey(activityType: string, weeklyClasses?: number | null): string {
    if (activityType === 'gym' || activityType === 'trial') return activityType
    if (!weeklyClasses) return activityType // fallback
    return `${activityType}_${weeklyClasses}`
}

/** Get the human-readable label for an activity type, optionally with class count */
export function getActivityLabel(type: string, weeklyClasses?: number | null): string {
    const base = ACTIVITY_LABELS[type] || type || '-'
    if (weeklyClasses && ['pilates', 'mixed'].includes(type)) {
        const monthly = weeklyClasses * 4
        return `${base} (${monthly} clases/mes)`
    }
    return base
}

/** Activity types that include pilates access */
export function hasPilatesAccess(type: string): boolean {
    return ['pilates', 'mixed'].includes(type)
}

/** Activity types that include gym access */
export function hasGymAccess(type: string): boolean {
    return ['gym', 'mixed', 'trial'].includes(type)
}

/** Check if the type is mixed */
export function isMixedType(type: string): boolean {
    return type === 'mixed'
}

/** Short labels for compact displays (tables, badges) */
export function getActivityShortLabel(type: string, weeklyClasses?: number | null): string {
    const labels: Record<string, string> = {
        'gym': 'Gimnasio',
        'pilates': 'Pilates',
        'mixed': 'Mixto',
        'trial': 'Prueba',
    }
    const base = labels[type] || type || '-'
    if (weeklyClasses && ['pilates', 'mixed'].includes(type)) {
        return `${base} ${weeklyClasses * 4}`
    }
    return base
}

/**
 * Look up the price for an activity from a prices array.
 * Prices array should have objects with { activity_type: string, price: number }.
 */
export function lookupPrice(
    prices: { activity_type: string; price: number }[],
    activityType: string,
    weeklyClasses?: number | null
): number {
    const key = getPriceKey(activityType, weeklyClasses)
    return prices?.find(p => p.activity_type === key)?.price || 0
}

/** Format a price as ARS currency string */
export function formatPrice(amount: number): string {
    return amount ? `$${amount.toLocaleString('es-AR')}` : '-'
}
