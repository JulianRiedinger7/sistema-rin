'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface RoutineItem {
    exercise_id: string
    sets: number
    reps: string
    target_rpe?: number
    notes?: string
    order_index: number
    day_number: number
    block_type: string
}

interface CreateRoutineData {
    activity_type: string
    name: string
    notes?: string
    global_structure?: string
    global_rpe?: string
    pdf_url?: string
    items: RoutineItem[]
}

export async function uploadRoutinePdf(formData: FormData) {
    const supabase = createAdminClient()

    const file = formData.get('file') as File
    if (!file || file.size === 0) {
        return { error: 'No se seleccionó ningún archivo' }
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
        return { error: 'Solo se permiten archivos PDF' }
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        return { error: 'El archivo no puede superar los 10MB' }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${timestamp}_${safeName}`

    const { data, error } = await supabase.storage
        .from('routine-pdfs')
        .upload(filePath, file, {
            contentType: 'application/pdf',
            upsert: false,
        })

    if (error) {
        return { error: 'Error al subir el PDF: ' + error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('routine-pdfs')
        .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
}

export async function createRoutine(data: CreateRoutineData) {
    const supabase = await createClient()

    // 1. Create Workout Header
    const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
            activity_type: data.activity_type,
            name: data.name,
            notes: data.notes,
            global_structure: data.global_structure,
            global_rpe: data.global_rpe,
            pdf_url: data.pdf_url || null,
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

    if (workoutError || !workout) {
        return { error: 'Error al crear la rutina: ' + workoutError?.message }
    }

    // 2. Create Workout Items
    const itemsToInsert = data.items.map((item) => ({
        workout_id: workout.id,
        exercise_id: item.exercise_id,
        sets: item.sets,
        reps: item.reps, // Now passing string
        target_rpe: item.target_rpe,
        notes: item.notes,
        order_index: item.order_index,
        day_number: item.day_number,
        block_type: item.block_type
    }))

    const { error: itemsError } = await supabase
        .from('workout_items')
        .insert(itemsToInsert)

    if (itemsError) {
        // Optional: Delete workout if items fail to ensure consistency (Transaction-like)
        await supabase.from('workouts').delete().eq('id', workout.id)
        return { error: 'Error al agregar ejercicios: ' + itemsError.message }
    }

    revalidatePath('/dashboard/admin/routines')
    return { success: true, workoutId: workout.id }
}

// ... (existing exports)

export async function toggleRoutineActive(id: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('workouts')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/routines')
    return { success: true }
}

export async function deleteRoutine(id: string) {
    const supabase = await createClient()

    // 1. Fetch the routine to get the pdf_url before deleting
    const { data: routine } = await supabase
        .from('workouts')
        .select('pdf_url')
        .eq('id', id)
        .single()

    // 2. If there's a PDF, delete it from Storage
    if (routine?.pdf_url) {
        try {
            // Extract the file path from the public URL
            // URL format: .../storage/v1/object/public/routine-pdfs/FILENAME
            const url = new URL(routine.pdf_url)
            const pathParts = url.pathname.split('/routine-pdfs/')
            if (pathParts[1]) {
                const filePath = decodeURIComponent(pathParts[1])
                const adminSupabase = createAdminClient()
                await adminSupabase.storage
                    .from('routine-pdfs')
                    .remove([filePath])
            }
        } catch (e) {
            // If PDF deletion fails, we still want to delete the routine
            console.error('Error al eliminar PDF del storage:', e)
        }
    }

    // 3. Delete the routine from the database
    const { error } = await supabase.from('workouts').delete().eq('id', id)

    if (error) {
        return { error: 'Error al eliminar la rutina' }
    }

    revalidatePath('/dashboard/admin/routines')
    return { success: true }
}

export async function getStudents() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
    return data || []
}

export async function getExercises() {
    const supabase = await createClient()
    const { data } = await supabase.from('exercises').select('id, name, category, muscle_group')
    return data || []
}
