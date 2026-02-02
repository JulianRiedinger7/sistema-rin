'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getStudentEmail } from '@/utils/auth-helpers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const input = formData.get('email') as string
    const password = formData.get('password') as string

    let email = input
    if (!input.includes('@')) {
        // Assume it's a DNI
        email = getStudentEmail(input)
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Credenciales inválidas' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
