'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { z } from 'zod'

const BookingSchema = z.object({
    date: z.date(),
    hour: z.number().int().min(6).max(22) // Reasonable pilates hours
})

import { Booking, PilatesConfig } from './types'
import { differenceInMinutes, startOfWeek, endOfWeek, format as formatDate } from 'date-fns'

export async function getPilatesConfig() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('pilates_config')
        .select('*')
        .single()

    if (error) {
        console.error('Error fetching pilates config detailed:', JSON.stringify(error, null, 2))
        return null
    }

    return {
        morning_start: data.morning_start_hour,
        morning_end: data.morning_end_hour,
        afternoon_start: data.afternoon_start_hour,
        afternoon_end: data.afternoon_end_hour,
    } as PilatesConfig
}

export async function getPilatesWeekConfig(weekStart: Date) {
    const supabase = await createClient()
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('pilates_week_configs')
        .select('*')
        .eq('week_start', weekStartStr)
        .maybeSingle()

    if (error) {
        console.error('Error fetching week config:', error)
        return null
    }

    if (data) {
        return {
            morning_start: data.morning_start_hour,
            morning_end: data.morning_end_hour,
            afternoon_start: data.afternoon_start_hour,
            afternoon_end: data.afternoon_end_hour,
        } as PilatesConfig
    }

    // Fallback to global config
    return getPilatesConfig()
}


export async function getBookingsForWeek(startDate: Date, endDate: Date) {
    const supabase = await createClient()
    const { data, error } = await supabase
        // ... existing getBookingsForWeek body ...
        .from('pilates_bookings')
        .select('*, profiles(dni, full_name)')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

    if (error) {
        console.error('Error fetching bookings detailed:', JSON.stringify(error, null, 2))
        return []
    }

    return data as Booking[]
}

export async function searchUsers(query: string) {
    if (!query || query.length < 2) return []

    // Sanitize input slightly (though parameterized queries handle SQL injection)
    const sanitizedQuery = query.replace(/[^\w\s@.-]/gi, '')

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, dni, full_name')
        .or(`full_name.ilike.%${sanitizedQuery}%,dni.ilike.%${sanitizedQuery}%`)
        .limit(10)

    if (error) {
        console.error(error)
        return []
    }
    return data
}

// ... imports


// ... existing code ...

export async function bookSlot(date: Date, hour: number) {
    const validation = BookingSchema.safeParse({ date, hour })
    if (!validation.success) return { error: 'Datos inválidos' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado' }

    const adminClient = createAdminClient()
    const dateStr = date.toISOString().split('T')[0]

    // Check user's profile for weekly class limit
    const { data: profile } = await adminClient
        .from('profiles')
        .select('activity_type, pilates_weekly_classes')
        .eq('id', user.id)
        .single()

    if (!profile || !['pilates', 'mixed'].includes(profile.activity_type || '')) {
        return { error: 'Tu plan no incluye Pilates' }
    }

    const weeklyLimit = profile.pilates_weekly_classes || 0
    if (weeklyLimit === 0) {
        return { error: 'No tienes clases de Pilates configuradas. Contacta a administración.' }
    }

    // Count bookings for this week
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    const weekStartStr = formatDate(weekStart, 'yyyy-MM-dd')
    const weekEndStr = formatDate(weekEnd, 'yyyy-MM-dd')

    const { count: weeklyCount } = await adminClient
        .from('pilates_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

    if ((weeklyCount || 0) >= weeklyLimit) {
        return { error: `Ya alcanzaste tu límite de ${weeklyLimit} clase${weeklyLimit > 1 ? 's' : ''} por semana` }
    }

    // Check capacity
    const { count, error: countError } = await adminClient
        .from('pilates_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr)
        .eq('hour', hour)

    if (countError) return { error: 'Error verificando cupo' }

    if ((count || 0) >= 5) {
        return { error: 'Turno lleno' }
    }

    // Check if slot is in the past
    const classIsoString = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00.000-03:00`
    const classDate = new Date(classIsoString)
    const now = new Date()

    if (classDate < now) {
        return { error: 'No se pueden reservar turnos pasados' }
    }

    const { error } = await adminClient
        .from('pilates_bookings')
        .insert({
            user_id: user.id,
            date: dateStr,
            hour: hour
        })

    if (error) {
        if (error.code === '23505') return { error: 'Ya estás anotado en este turno' }
        return { error: error.message }
    }

    return { success: true }
}

export async function cancelBooking(date: Date, hour: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado' }

    const adminClient = createAdminClient() // For DB operations
    const dateStr = date.toISOString().split('T')[0]

    // Check strict 2 hour cancellation policy
    // Construct class time assuming Gym is in Argentina (UTC-3)
    // We use the dateStr (YYYY-MM-DD) and the hour to create a specific point in time
    const classIsoString = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00.000-03:00`
    const classDate = new Date(classIsoString)
    const now = new Date()

    // Check if class is in the past or within 2 hours (120 minutes)
    const minutesUntilClass = differenceInMinutes(classDate, now)

    // Allow cancelling if it's more than 2 hours away.
    // Restrict if it's less than 120 minutes away.
    if (minutesUntilClass <= 120) {
        return { error: 'No es posible cancelar con menos de 2 horas de anticipación. Por favor comunícate con administración.' }
    }

    const { error } = await adminClient
        .from('pilates_bookings')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .eq('hour', hour)

    if (error) return { error: error.message }

    return { success: true }
}

export async function updatePilatesConfig(config: PilatesConfig) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('pilates_config')
        .update({
            morning_start_hour: config.morning_start,
            morning_end_hour: config.morning_end,
            afternoon_start_hour: config.afternoon_start,
            afternoon_end_hour: config.afternoon_end
        })
        .eq('id', 1)

    if (error) return { error: error.message }
    return { success: true }
}

export async function updatePilatesWeekConfig(weekStart: Date, config: PilatesConfig) {
    const supabase = await createClient()
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { error } = await supabase
        .from('pilates_week_configs')
        .upsert({
            week_start: weekStartStr,
            morning_start_hour: config.morning_start,
            morning_end_hour: config.morning_end,
            afternoon_start_hour: config.afternoon_start,
            afternoon_end_hour: config.afternoon_end
        }, { onConflict: 'week_start' })

    if (error) {
        console.error('Error updating week config:', error)
        return { error: error.message }
    }

    return { success: true }
}

// --- Slot Teachers ---

export interface SlotTeacher {
    date: string
    hour: number
    teacher_name: string
}

export async function getSlotTeachers(startDate: Date, endDate: Date): Promise<SlotTeacher[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('pilates_slot_teachers')
        .select('date, hour, teacher_name')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

    if (error) {
        console.error('Error fetching slot teachers:', error)
        return []
    }
    return data as SlotTeacher[]
}

export async function setSlotTeacher(date: Date, hour: number, teacherName: string) {
    const supabase = await createClient()
    const dateStr = date.toISOString().split('T')[0]

    if (!teacherName.trim()) {
        // Remove teacher assignment
        const { error } = await supabase
            .from('pilates_slot_teachers')
            .delete()
            .eq('date', dateStr)
            .eq('hour', hour)

        if (error) return { error: error.message }
        return { success: true }
    }

    const { error } = await supabase
        .from('pilates_slot_teachers')
        .upsert(
            { date: dateStr, hour, teacher_name: teacherName },
            { onConflict: 'date,hour' }
        )

    if (error) {
        console.error('Error setting slot teacher:', error)
        return { error: error.message }
    }
    return { success: true }
}
