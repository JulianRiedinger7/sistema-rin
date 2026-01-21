import { createClient } from '@/utils/supabase/server'
import { DashboardStats } from './dashboard-stats'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Fetch all student profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at, full_name')
        .eq('role', 'student')

    // Fetch all payments
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id, date, status')

    return (
        <div className="p-6 bg-background min-h-screen text-foreground space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
                <p className="text-muted-foreground mt-2">Bienvenido al panel de control.</p>
            </div>

            <DashboardStats
                profiles={profiles || []}
                payments={payments || []}
            />

            {/* Hint for Users List */}
            {/* Since we have the users list in /admin/users, maybe we can embed it here later 
                or just link to it. For now, let's keep it clean as requested. */}
        </div>
    )
}
