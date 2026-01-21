'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookSlot(slotId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // 1. Check capacity transactionally or optimistically
    // For MVP, simplistic check:
    const { data: slot } = await supabase.from('pilates_slots').select('*').eq('id', slotId).single()

    if (!slot) return { error: 'Clase no encontrada' }
    if (slot.booked_count >= slot.capacity) return { error: 'Clase llena' }

    // 2. Insert booking
    const { error: bookingError } = await supabase.from('pilates_bookings').insert({
        user_id: user.id,
        slot_id: slotId,
        status: 'confirmed'
    })

    if (bookingError) return { error: bookingError.message }

    // 3. Increment count (Trigger would be better but doing manual update for MVP speed)
    // Assuming no race condition for this low-volume MVP, otherwise use RPC increment
    const { error: updateError } = await supabase
        .from('pilates_slots')
        .update({ booked_count: slot.booked_count + 1 })
        .eq('id', slotId)

    revalidatePath('/dashboard/student/pilates')
    return { success: true }
}

export async function cancelBooking(bookingId: string, slotId: string) {
    const supabase = await createClient()

    // 1. Delete booking
    const { error } = await supabase.from('pilates_bookings').delete().eq('id', bookingId)
    if (error) return { error: error.message }

    // 2. Decrement count
    // Ideally fetch current count first to be safe
    const { data: slot } = await supabase.from('pilates_slots').select('booked_count').eq('id', slotId).single()

    if (slot && slot.booked_count > 0) {
        await supabase
            .from('pilates_slots')
            .update({ booked_count: slot.booked_count - 1 })
            .eq('id', slotId)
    }

    revalidatePath('/dashboard/student/pilates')
    return { success: true }
}
