import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check if profile exists and role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Check if health sheet exists
    const { data: healthSheet } = await supabase
        .from('health_sheets')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (profile?.role === 'student' && !healthSheet) {
        redirect('/onboarding')
    }

    if (profile?.role === 'admin') {
        redirect('/dashboard/admin')
    } else {
        redirect('/dashboard/student')
    }
}
