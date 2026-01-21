'use server'

import { createClient } from '@/utils/supabase/server'
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
    items: RoutineItem[]
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
    // ...

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
