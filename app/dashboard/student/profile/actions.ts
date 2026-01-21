'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ProfileUpdateSchema = z.object({
    dni: z.string().min(6, "DNI inválido"),
    phone: z.string().min(6, "Teléfono inválido"),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    weight: z.string().optional(),
    height: z.string().optional(),
    goals: z.string().min(1, "Objetivos requeridos"),
    injuries: z.string().optional(),
    medicalConditions: z.string().optional(),
    allergies: z.string().optional(),
})

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const rawData = {
        dni: formData.get('dni'),
        phone: formData.get('phone'),
        dateOfBirth: formData.get('dateOfBirth'),
        weight: formData.get('weight'),
        height: formData.get('height'),
        goals: formData.get('goals'),
        injuries: formData.get('injuries'),
        medicalConditions: formData.get('medicalConditions'),
        allergies: formData.get('allergies'),
    }

    const validated = ProfileUpdateSchema.safeParse(rawData)

    if (!validated.success) {
        const firstError = validated.error.errors[0]?.message
        return { error: firstError || 'Datos inválidos.' }
    }

    // Check if DNI Changed using Admin Client (to handle Auth updates)
    // Actually we can check current profile first
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('dni')
        .eq('id', user.id)
        .single()

    const newDni = validated.data.dni
    const oldDni = currentProfile?.dni

    // 1. Update Profile (including DNI)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            dni: newDni,
            phone: validated.data.phone,
            date_of_birth: validated.data.dateOfBirth,
        })
        .eq('id', user.id)

    if (profileError) {
        if (profileError.code === '23505') return { error: 'El DNI ya está registrado.' } // Unique constraint
        return { error: 'Error al actualizar datos personales.' }
    }

    // 2. If DNI changed, update Auth Email
    if (newDni && newDni !== oldDni) {
        const adminClient = createAdminClient()
        const newEmail = `${newDni}@rin.com`

        const { error: authError } = await adminClient.auth.admin.updateUserById(
            user.id,
            {
                email: newEmail,
                user_metadata: {
                    ...user.user_metadata,
                    dni: newDni
                },
                email_confirm: true // Auto confirm strict DNI email
            }
        )

        if (authError) {
            console.error('Auth update error:', authError)
            return { error: 'Perfil actualizado, pero hubo un error actualizando el Login. Contacta a soporte.' }
        }
    }

    // 3. Update Health Sheet
    const weightVal = validated.data.weight ? parseFloat(validated.data.weight) : null
    const heightVal = validated.data.height ? parseFloat(validated.data.height) : null

    const { error: healthError } = await supabase
        .from('health_sheets')
        .update({
            weight: weightVal,
            height: heightVal,
            goals: validated.data.goals,
            injuries: validated.data.injuries,
            medical_conditions: validated.data.medicalConditions,
            allergies: validated.data.allergies,
        })
        .eq('user_id', user.id)

    if (healthError) {
        return { error: 'Error al actualizar ficha médica.' }
    }

    revalidatePath('/dashboard/student/profile')
    return { success: 'Perfil actualizado correctamente.' }
}
