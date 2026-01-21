'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStudents() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, dni')
        .eq('role', 'student')
        .order('full_name')

    if (error) {
        console.error('Error fetching students:', error)
        return []
    }
    return data
}

export async function saveTestResult(
    userId: string,
    exerciseType: string,
    weight: number,
    date: Date
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('benchmark_logs')
        .insert({
            user_id: userId,
            exercise_type: exerciseType,
            weight: weight,
            date: date.toISOString().split('T')[0], // Format YYYY-MM-DD
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/tests')
    return { success: true }
}
