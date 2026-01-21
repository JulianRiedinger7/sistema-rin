'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const BenchmarkSchema = z.object({
    id: z.string().optional(),
    exerciseType: z.enum(['Sentadilla', 'Hip Thrust', 'Banco Plano', 'Remo', 'Dominadas']),
    weight: z.string().min(1, 'El peso es requerido'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida'),
})

export async function updateBenchmark(formData: FormData) {
    const supabase = await createClient()

    // Admin check (RLS handles it, but good to have)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const rawData = {
        id: formData.get('id'),
        exerciseType: formData.get('exerciseType'),
        weight: formData.get('weight'),
        date: formData.get('date'),
    }

    const validated = BenchmarkSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Datos inválidos' }
    }

    if (!validated.data.id) return { error: 'ID requerido para actualizar' }

    const { error } = await supabase
        .from('benchmark_logs')
        .update({
            exercise_type: validated.data.exerciseType,
            weight: parseFloat(validated.data.weight),
            date: validated.data.date,
        })
        .eq('id', validated.data.id)

    if (error) {
        console.error('Error updating benchmark:', error)
        return { error: 'Error al actualizar' }
    }

    revalidatePath('/dashboard/admin/users/[id]/progress')
    // Note: We might need to revalidate the exact path if possible, but generic catch-all works or revalidatePath with page option
    return { success: true }
}

export async function deleteBenchmark(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('benchmark_logs')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting benchmark:', error)
        return { error: 'Error al eliminar' }
    }

    revalidatePath('/dashboard/admin/users/[id]/progress')
    return { success: true }
}
