'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ExerciseSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    video_url: z.string().optional().nullable().or(z.literal('')),
    muscle_group: z.string().optional().nullable().or(z.literal('')),
    category: z.enum(['Fuerza', 'Potencia', 'Aerobico', 'Pilates', 'Movilidad'], {
        message: "Debes seleccionar una categoría válida",
    }),
})

export async function createExercise(formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        name: formData.get('name'),
        video_url: formData.get('video_url'),
        muscle_group: formData.get('muscle_group'),
        category: formData.get('category'),
    }

    const validatedFields = ExerciseSchema.safeParse(rawData)

    if (!validatedFields.success) {
        const errorMessages = validatedFields.error.flatten().fieldErrors
        const errorString = Object.entries(errorMessages)
            .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
            .join(' | ')
        return { error: `Datos inválidos: ${errorString}` }
    }

    // Clean up data before inserting
    const insertData = {
        ...validatedFields.data,
        // Ensure empty strings are treated as null if preferred, or keep as is.
        // For video_url, if it's empty string, Supabase might handle it or we might prefer null.
        video_url: validatedFields.data.video_url || null,
        muscle_group: validatedFields.data.muscle_group || null,
    }

    const { error } = await supabase.from('exercises').insert(insertData)

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

    const rawData = {
        name: formData.get('name'),
        video_url: formData.get('video_url'),
        muscle_group: formData.get('muscle_group'),
        category: formData.get('category'),
    }

    const validatedFields = ExerciseSchema.safeParse(rawData)

    if (!validatedFields.success) {
        const errorMessages = validatedFields.error.flatten().fieldErrors
        const errorString = Object.entries(errorMessages)
            .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
            .join(' | ')
        return { error: `Datos inválidos: ${errorString}` }
    }

    // Clean up data before updating
    const updateData = {
        ...validatedFields.data,
        video_url: validatedFields.data.video_url || null,
        muscle_group: validatedFields.data.muscle_group || null,
    }

    const { error } = await supabase
        .from('exercises')
        .update(updateData)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/exercises')
    return { success: true }
}
