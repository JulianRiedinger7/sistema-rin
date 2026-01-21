export interface Booking {
    id: string
    user_id: string
    date: string
    hour: number
    created_at: string
    profiles?: {
        dni: string
        full_name: string
    }
}

export interface PilatesConfig {
    morning_start: number
    morning_end: number
    afternoon_start: number
    afternoon_end: number
}
