'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ... imports
import { createAdminClient } from '@/utils/supabase/admin'

export async function logSet(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const exerciseId = formData.get('exerciseId') as string
    const workoutItemId = formData.get('workoutItemId') as string
    const weight = Number(formData.get('weight'))
    const rpe = Number(formData.get('rpe'))
    const notes = formData.get('notes') as string
    const userId = (await supabase.auth.getUser()).data.user?.id

    if (!userId) return { error: 'Unauthorized' }

    // Use admin client for insert to ensure RLS doesn't block
    const { error } = await adminSupabase.from('progress_logs').insert({
        user_id: userId,
        exercise_id: exerciseId,
        workout_item_id: workoutItemId,
        weight_used: weight,
        rpe_actual: rpe,
        notes: notes,
    })

    if (error) {
        return { error: error.message }
    }

    // Optional: revalidate path if we show logs immediately
    revalidatePath('/dashboard/student/routine')
    return { success: true }
}

export async function completeWorkoutDay(workoutId: string, dayNumber: number, durationSeconds: number) {
    const supabase = await createClient()

    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('workout_completions')
        .insert({
            user_id: user.id,
            workout_id: workoutId,
            day_number: dayNumber,
            duration_seconds: durationSeconds
        })

    if (error) {
        // Handle unique constraint violation gracefully (already completed)
        if (error.code === '23505') return { success: true }
        return { error: error.message }
    }

    revalidatePath('/dashboard/student')
    return { success: true }
}



export async function getLastExerciseLogs(exerciseIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Use Admin Client to bypass RLS for reading logs
    const adminClient = createAdminClient()

    const { data } = await adminClient
        .from('progress_logs')
        .select('*')
        .in('exercise_id', exerciseIds)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

    if (!data) return []

    // Group by exercise_id and take the first one (latest)
    const latestLogs: Record<string, any> = {}
    data.forEach((log) => {
        if (!latestLogs[log.exercise_id]) {
            latestLogs[log.exercise_id] = log
        }
    })

    return latestLogs
}

export async function getStudentLogs(userId: string, startTime: string, endTime: string) {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Security check: User can only read their own logs (unless admin, but let's stick to self-read context)
    if (user.id !== userId) {
        // Check if requester is admin if needed, strict for now
        // For 'completed-routine-viewer' user_id matches auth.uid
        // But let's allow it if it matches OR if user is admin.
        // For simplicity/security in this context: strict match or admin.
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (user.id !== userId && profile?.role !== 'admin') {
            return []
        }
    }

    const adminClient = createAdminClient()
    const { data } = await adminClient
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startTime)
        .lte('created_at', endTime)
        .order('created_at', { ascending: false })

    return data || []
}
