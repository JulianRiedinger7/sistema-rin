'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createExpense(formData: FormData) {
    const supabase = await createClient()

    const description = formData.get('description') as string
    const amount = formData.get('amount')
    const date = formData.get('date') as string
    const activity = formData.get('activity') as string

    if (!description || !amount || !date || !activity) {
        return { error: 'Todos los campos son requeridos' }
    }

    const { error } = await supabase
        .from('expenses')
        .insert({
            description,
            amount,
            date,
            activity,
        })

    if (error) {
        return { error: 'Error al crear el gasto' }
    }

    revalidatePath('/dashboard/admin/expenses')
    return { success: true }
}

export async function deleteExpense(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Error al eliminar el gasto' }
    }

    revalidatePath('/dashboard/admin/expenses')
    return { success: true }
}
