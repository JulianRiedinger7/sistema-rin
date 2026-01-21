'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSlot(formData: FormData) {
    const supabase = await createClient()

    const startTime = formData.get('startTime') as string
    const duration = Number(formData.get('duration')) // in minutes
    const capacity = Number(formData.get('capacity'))

    if (!startTime || !duration || !capacity) {
        return { error: 'Faltan datos obligatorios' }
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + duration * 60000)

    const { error } = await supabase.from('pilates_slots').insert({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        capacity,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/pilates')
    return { success: true }
}

export async function deleteSlot(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('pilates_slots').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/pilates')
    return { success: true }
}
