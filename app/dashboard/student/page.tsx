import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dumbbell, Clock, CheckCircle } from 'lucide-react'
import ActiveRoutineViewer from './active-routine-viewer'
import { FinishedRoutinesList } from './progress/finished-routines'
import { redirect } from 'next/navigation'
import { QuotaStatus } from './quota-status'

export default async function StudentDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('activity_type, created_at')
        .eq('id', user.id)
        .single()

    const { data: payments } = await supabase
        .from('payments')
        .select('date, status')
        .eq('user_id', user.id)

    const activityType = profile?.activity_type || 'gym'

    let query = supabase
        .from('workouts')
        .select(`
            *,
            workout_items (
                day_number
            )
        `)

    if (activityType === 'mixed') {
        query = query.in('activity_type', ['gym', 'pilates', 'mixed'])
    } else {
        query = query.or(`activity_type.eq.${activityType},activity_type.eq.mixed`)
    }

    // Only show active routines
    query = query.eq('is_active', true)

    const { data: routines } = await query

    // Fetch completed days for this user
    const { data: completions } = await supabase
        .from('workout_completions')
        .select('*, workout:workouts(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

    // Helper to check if a specific day of a routine is completed
    const isDayCompleted = (workoutId: string, day: number) => {
        return completions?.some(c => c.workout_id === workoutId && c.day_number === day)
    }

    // We fetch completions with nested workout details for the list
    // We already have 'completions' variable with the data needed for FinishedRoutinesList

    const days = [1, 2, 3, 4, 5]

    if (!routines || routines.length === 0) {
        return (
            <div className="container py-8 space-y-8 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mi Entrenamiento</h1>
                        <p className="text-muted-foreground">
                            Actividad: <span className="capitalize font-medium text-primary">{activityType}</span>
                        </p>
                    </div>
                    <QuotaStatus
                        createdAt={profile?.created_at}
                        payments={payments || []}
                    />
                </div>

                <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-xl border-2 border-dashed">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <Dumbbell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No tienes rutina asignada aún</h3>
                    <p className="text-muted-foreground max-w-md">
                        Consulta a tu profesor para que te asigne un plan de entrenamiento personalizado.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Entrenamiento</h1>
                    <p className="text-muted-foreground">
                        Actividad: <span className="capitalize font-medium text-primary">{activityType}</span>
                    </p>
                </div>
                <QuotaStatus
                    createdAt={profile?.created_at}
                    payments={payments || []}
                />
            </div>

            <Tabs defaultValue="day-1" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-xl">
                    {days.map(day => (
                        <TabsTrigger key={day} value={`day-${day}`} className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Día {day}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {days.map(day => (
                    <TabsContent key={day} value={`day-${day}`} className="space-y-6 animate-in fade-in-50 duration-300">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {routines?.filter(routine => {
                                // Check if routine has items for this day
                                const hasItems = routine.workout_items.some((item: any) => item.day_number === day)
                                // Check if already completed
                                const completed = isDayCompleted(routine.id, day)
                                return hasItems && !completed
                            }).map(routine => (
                                <ActiveRoutineViewer
                                    key={`${routine.id}-${day}`}
                                    routine={routine}
                                    day={day}
                                />
                            ))}

                            {/* Empty State */}
                            {routines?.filter(r => r.workout_items.some((i: any) => i.day_number === day) && !isDayCompleted(r.id, day)).length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium">Todo listo por hoy</h3>
                                    <p>No hay rutinas pendientes para el Día {day}.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Finished Routines Section */}
            <div className="mt-12 pt-12 border-t">
                <h2 className="text-2xl font-bold mb-6">Historial de Rutinas</h2>
                <FinishedRoutinesList completions={completions || []} />
            </div>
        </div>
    )
}
