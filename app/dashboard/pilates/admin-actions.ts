'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adminBookSlot(date: Date, hour: number, targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Verify Admin Role securely
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador.' }
    }

    // Use Admin Client to bypass RLS for inserting on behalf of another user
    const adminClient = createAdminClient()
    const dateStr = date.toISOString().split('T')[0]

    // Check capacity (Admin client can see all)
    const { count, error: countError } = await adminClient
        .from('pilates_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr)
        .eq('hour', hour)

    if (countError) return { error: 'Error verificando cupo' }

    if ((count || 0) >= 5) {
        return { error: 'Turno lleno' }
    }

    const { error } = await adminClient
        .from('pilates_bookings')
        .insert({
            user_id: targetUserId,
            date: dateStr,
            hour: hour
        })

    if (error) {
        if (error.code === '23505') return { error: 'El usuario ya está anotado en este turno' }
        return { error: 'Error reservando: ' + error.message }
    }

    revalidatePath('/dashboard/admin/pilates')
    revalidatePath('/dashboard/student/pilates')
    return { success: true }
}

export async function adminCancelBooking(date: Date, hour: number, targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Verify Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador.' }
    }

    const adminClient = createAdminClient()
    const dateStr = date.toISOString().split('T')[0]

    const { error } = await adminClient
        .from('pilates_bookings')
        .delete()
        .eq('user_id', targetUserId)
        .eq('date', dateStr)
        .eq('hour', hour)

    if (error) return { error: 'Error cancelando: ' + error.message }

    revalidatePath('/dashboard/admin/pilates')
    revalidatePath('/dashboard/student/pilates')
    return { success: true }
}
