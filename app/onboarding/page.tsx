import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('dni, has_accepted_terms')
        .eq('id', user.id)
        .single()

    const { data: healthSheet } = await supabase
        .from('health_sheets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (profile?.has_accepted_terms && healthSheet) {
        redirect('/dashboard')
    }

    const { data: prices } = await supabase
        .from('activity_prices')
        .select('*')

    return <OnboardingForm initialDni={profile?.dni || ''} prices={prices || []} />
}
