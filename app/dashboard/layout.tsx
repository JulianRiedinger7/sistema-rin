import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, has_accepted_terms')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'student'

    if (role === 'student' && !profile?.has_accepted_terms) {
        redirect('/onboarding')
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar for Desktop */}
            <Sidebar role={role} className="hidden md:flex" />

            <div className="flex flex-1 flex-col">
                {/* Mobile Nav */}
                <MobileNav role={role} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
