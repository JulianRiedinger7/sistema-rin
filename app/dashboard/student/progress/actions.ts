'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const BenchmarkSchema = z.object({
    exerciseType: z.enum(['Sentadilla', 'Hip Thrust', 'Banco Plano', 'Remo', 'Dominadas']),
    weight: z.string().min(1, 'El peso es requerido'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida'),
})

export async function getBenchmarks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('benchmark_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true }) // Keep this for chart (ascending)
        .order('created_at', { ascending: true })

    return data || []
}

export async function addBenchmark(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado' }

    const rawData = {
        exerciseType: formData.get('exerciseType'),
        weight: formData.get('weight'),
        date: formData.get('date'),
    }

    const validated = BenchmarkSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Datos inválidos' }
    }

    const { error } = await supabase.from('benchmark_logs').insert({
        user_id: user.id,
        exercise_type: validated.data.exerciseType,
        weight: parseFloat(validated.data.weight),
        date: validated.data.date,
    })

    if (error) {
        console.error('Error adding benchmark:', error)
        return { error: 'Error al guardar el registro' }
    }

    revalidatePath('/dashboard/student/progress')
    return { success: true }
}

export async function getFinishedRoutines() {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []

    const { data } = await supabase
        .from('workout_completions')
        .select(`
            id,
            completed_at,
            workout:workouts (
                name,
                activity_type
            )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

    return data || []
}
