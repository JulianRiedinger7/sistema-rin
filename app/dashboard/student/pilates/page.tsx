import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PilatesScheduler } from '@/components/pilates/scheduler-grid'
import { getPilatesConfig, getBookingsForWeek } from '@/app/dashboard/pilates/actions'
import { startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default async function StudentPilatesPage() {
    const supabase = await createClient()
    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error('Auth User Error:', authError)
        redirect('/login')
    }

    // Profile Check for 'Pilates' or 'Mixto'
    const { data: profile } = await supabase
        .from('profiles')
        .select('activity_type, role')
        .eq('id', user.id)
        .single()


    // Allow Admins to view too. Check activity_type case-insensitively.
    const activityInfo = profile?.activity_type?.toLowerCase() || ''
    const isAllowed = profile?.role === 'admin' || activityInfo.includes('pilates') || activityInfo.includes('mixto') || activityInfo.includes('mixed')

    if (!isAllowed) {
        return (
            <div className="container mx-auto py-12 flex justify-center">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-red-800">Acceso Restringido</h2>
                        <p className="text-red-600">
                            Esta sección es exclusiva para alumnos de Pilates.
                            <br />
                            Tu plan actual es: <strong>{profile?.activity_type || 'Desconocido'}</strong>.
                        </p>
                        <Button asChild variant="outline" className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900">
                            <Link href="/dashboard/student">Volver al Inicio</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fetch Data for Schedule
    // We re-use the client-side actions but call them server-side here or just duplicate fetch logic?
    // Note: getPilatesConfig and getBookingsForWeek in 'actions.ts' use 'createClient' from '@/utils/supabase/client'
    // This MIGHT NOT WORK in Server Component if that utility is browser-only.
    // Let's check imports.
    // If 'actions.ts' uses 'client', we should create a 'wrapper' client component OR just fetch data here directly using server supabase.

    // Better approach for Server Component: Fetch directly here using 'supabase' server client.

    const { data: configData } = await supabase
        .from('pilates_config')
        .select('*')
        .single()

    const config = {
        morning_start: configData?.morning_start_hour || 7,
        morning_end: configData?.morning_end_hour || 12,
        afternoon_start: configData?.afternoon_start_hour || 16,
        afternoon_end: configData?.afternoon_end_hour || 21,
    }

    const { data: bookingsData } = await supabase
        .from('pilates_bookings')
        .select('*')
        .gte('date', startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0])
        .lte('date', endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0])

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cronograma Pilates</h1>
                    <p className="text-muted-foreground">Reserva tus turnos semanales.</p>
                </div>
                {profile?.role === 'admin' && (
                    <Button asChild variant="secondary">
                        <Link href="/dashboard/admin/pilates">Vista Admin</Link>
                    </Button>
                )}
            </div>

            <PilatesScheduler
                config={config}
                initialBookings={bookingsData || []}
                userId={user.id}
            />
        </div>
    )
}
