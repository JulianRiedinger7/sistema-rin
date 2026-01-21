'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'

export async function approvePayment(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/payments')
    return { success: true }
}

export async function registerPayment(formData: FormData) {
    const supabase = await createClient()

    const userId = formData.get('userId') as string
    const amount = Number(formData.get('amount'))
    const method = formData.get('method') as 'cash' | 'transfer'
    const date = formData.get('date') as string
    const activity = formData.get('activity') as string

    if (!userId || !amount || !method || !date || !activity) {
        return { error: 'Faltan datos obligatorios' }
    }

    // Fix Date Timezone Issue:
    // The date from input type="date" is "YYYY-MM-DD". 
    // new Date("2024-01-18") creates a UTC date at 00:00.
    // In Argentina (UTC-3), this is 21:00 of the PREVIOUS day if displayed in local time.
    // To fix, we can append a time like T12:00:00 to be safely in the middle of the day,
    // or just store the string as is if we only care about the date part. 
    // Since the DB uses timestamptz, let's make it noon UTC.
    const dateObj = new Date(date + 'T12:00:00Z')

    const { error } = await supabase.from('payments').insert({
        user_id: userId,
        amount,
        method: method,
        status: 'paid',
        date: dateObj.toISOString(),
        activity: activity // Save the activity
    })

    if (error) {
        return { error: error.message }
    }

    // If activity is provided, update profile activity using Admin Client to bypass RLS
    if (activity) {
        const adminSupabase = createAdminClient()
        await adminSupabase
            .from('profiles')
            .update({ activity_type: activity })
            .eq('id', userId)
    }

    revalidatePath('/dashboard/admin/payments')
    revalidatePath('/dashboard/admin/users') // Status might change
    revalidatePath('/dashboard/student') // Update activity for student
    return { success: true }
}

export async function rejectPayment(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('payments')
        .update({ status: 'overdue' }) // Or 'rejected', but schema has 'overdue'
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/payments')
    return { success: true }
}

export async function updatePrice(activity: string, price: number) {
    const supabase = await createClient()

    if (!activity || !price) {
        return { error: 'Datos inválidos' }
    }

    const { error } = await supabase
        .from('activity_prices')
        .upsert({
            activity_type: activity,
            price: price,
            updated_at: new Date().toISOString()
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/payments')
    revalidatePath('/dashboard/student/profile', 'page')
    return { success: true }
}
