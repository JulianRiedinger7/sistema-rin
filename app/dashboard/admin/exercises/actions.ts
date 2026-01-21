'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ExerciseSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    video_url: z.string().optional(),
    muscle_group: z.string().optional(),
    category: z.enum(['Fuerza', 'Potencia', 'Aerobico', 'Pilates', 'Movilidad'], {
        message: "Debes seleccionar una categoría",
    }),
})

export async function createExercise(formData: FormData) {
    const supabase = await createClient()

    const validatedFields = ExerciseSchema.safeParse({
        name: formData.get('name'),
        video_url: formData.get('video_url'),
        muscle_group: formData.get('muscle_group'),
        category: formData.get('category'),
    })

    if (!validatedFields.success) {
        return { error: 'Datos inválidos checkea los campos' }
    }

    const { error } = await supabase.from('exercises').insert(validatedFields.data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/exercises')
    return { success: true }
}

export async function deleteExercise(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('exercises').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/exercises')
    return { success: true }
}

export async function updateExercise(id: string, formData: FormData) {
    const supabase = await createClient()

    const validatedFields = ExerciseSchema.safeParse({
        name: formData.get('name'),
        video_url: formData.get('video_url'),
        muscle_group: formData.get('muscle_group'),
        category: formData.get('category'),
    })

    if (!validatedFields.success) {
        return { error: 'Datos inválidos' }
    }

    const { error } = await supabase
        .from('exercises')
        .update(validatedFields.data)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/exercises')
    return { success: true }
}
