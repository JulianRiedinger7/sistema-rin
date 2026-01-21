'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getStudentEmail } from '@/utils/auth-helpers'
import { revalidatePath } from 'next/cache'

export async function createStudent(formData: FormData) {
    const supabase = await createClient()

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'No autorizado' }
    }

    const fullName = formData.get('fullName') as string
    const dni = formData.get('dni') as string

    if (!fullName || !dni) {
        return { error: 'Nombre y DNI son requeridos' }
    }

    const email = getStudentEmail(dni)
    const password = dni // Initial password is DNI

    const adminClient = createAdminClient()

    const { error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            dni: dni,
            has_accepted_terms: false
        }
    })

    if (createError) {
        console.error('Error creating user:', createError)
        return { error: createError.message }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: 'Alumno creado exitosamente' }
}

export async function deleteStudent(studentId: string) {
    const supabase = await createClient()

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'No autorizado' }
    }

    const adminClient = createAdminClient()

    // Delete user from Auth (this cascades to profiles if set up, but let's be sure)
    const { error } = await adminClient.auth.admin.deleteUser(studentId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: 'Alumno eliminado exitosamente' }
}

export async function updateStudent(formData: FormData) {
    const supabase = await createClient()

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'No autorizado' }
    }

    const studentId = formData.get('studentId') as string
    const fullName = formData.get('fullName') as string
    const dni = formData.get('dni') as string

    // Optional: Allow updating email directly? No, keeping the DNI pattern.

    if (!studentId || !fullName || !dni) {
        return { error: 'Datos incompletos' }
    }

    const adminClient = createAdminClient()

    // 1. Get current student data to check if DNI changed
    const { data: currentStudent, error: fetchError } = await adminClient.auth.admin.getUserById(studentId)

    if (fetchError || !currentStudent) {
        return { error: 'No se encontró el usuario' }
    }

    const currentDni = currentStudent.user.user_metadata.dni
    const newEmail = getStudentEmail(dni)

    // 2. Update Auth User if DNI changed (Email & Password & Metadata)
    if (currentDni !== dni) {
        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(studentId, {
            email: newEmail,
            password: dni, // Reset password to new DNI
            email_confirm: true,
            user_metadata: {
                ...currentStudent.user.user_metadata,
                full_name: fullName,
                dni: dni
            }
        })

        if (updateAuthError) {
            return { error: 'Error actualizando credenciales: ' + updateAuthError.message }
        }
    } else {
        // Just update metadata (name) if DNI is same
        const { error: updateMetaError } = await adminClient.auth.admin.updateUserById(studentId, {
            user_metadata: {
                ...currentStudent.user.user_metadata,
                full_name: fullName
            }
        })
        if (updateMetaError) {
            return { error: 'Error actualizando metadatos' }
        }
    }

    // 3. Update Profiles Table (Trigger might handle this, but explicit is safer)
    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            dni: dni,
            // email: newEmail // stored in auth, usually trigger syncs or just kept in auth
        })
        .eq('id', studentId)

    if (updateProfileError) {
        return { error: 'Error actualizando perfil: ' + updateProfileError.message }
    }

    revalidatePath('/dashboard/admin/users')
    revalidatePath(`/dashboard/admin/users/${studentId}`)
    return { success: 'Alumno actualizado exitosamente' }
}
