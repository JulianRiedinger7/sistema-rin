import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ProgressCharts } from '@/app/dashboard/student/progress/progress-charts'
import { ManageBenchmarks } from './manage-benchmarks'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUserProgressPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch User Profile basics
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', id)
        .single()

    if (!profile) return notFound()

    // Fetch Benchmarks
    const { data: logs } = await supabase
        .from('benchmark_logs')
        .select('*')
        .eq('user_id', id)
        .order('date', { ascending: true })

    const safeLogs = logs || []

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/admin/users/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Progreso: {profile.full_name}</h1>
                    <p className="text-muted-foreground">Visualización y gestión de testeos de fuerza.</p>
                </div>
            </div>

            {/* Reused Chart Component */}
            <ProgressCharts logs={safeLogs} />

            {/* Management Table */}
            <ManageBenchmarks logs={safeLogs} userId={id} />
        </div>
    )
}
