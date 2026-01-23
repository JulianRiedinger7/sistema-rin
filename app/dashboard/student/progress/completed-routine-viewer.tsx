'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video, Clock, TrendingUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/utils/supabase/client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getStudentLogs } from '../actions'

interface CompletedRoutineViewerProps {
    completion: any
    children: React.ReactNode
}

export default function CompletedRoutineViewer({ completion, children }: CompletedRoutineViewerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true)
                const supabase = createClient()

                // 1. Fetch workout items for this routine/day
                const { data: itemsData } = await supabase
                    .from('workout_items')
                    .select('*, exercises(*)')
                    .eq('workout_id', completion.workout_id)
                    .eq('day_number', completion.day_number)
                    .order('order_index')

                if (itemsData) setItems(itemsData)

                // 2. Fetch logs for this user around the completion time
                // We look for logs created up to 12 hours before the completion time.
                // This handles workouts crossing midnight and timezone shifts better than "same day".
                const completionDate = new Date(completion.completed_at)
                const startTime = new Date(completionDate.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
                const endTime = new Date(completionDate.getTime() + 5 * 60 * 1000) // 5 minutes buffer after

                // Use Server Action to bypass RLS issues cleanly
                const logsData = await getStudentLogs(
                    completion.user_id,
                    startTime.toISOString(),
                    endTime.toISOString()
                )

                if (logsData) setLogs(logsData)

                setIsLoading(false)
            }
            fetchData()
        }
    }, [isOpen, completion])

    const getLogForItem = (itemId: string) => {
        // Since we ordered by created_at desc, the first match is the latest one for this session
        return logs.find(log => log.workout_item_id === itemId)
    }

    const durationMinutes = completion.duration_seconds
        ? Math.floor(completion.duration_seconds / 60)
        : 0

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/10">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="capitalize">
                            {completion.workout?.activity_type || 'Training'}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {durationMinutes} min
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {new Date(completion.completed_at).toLocaleDateString()}
                        </span>
                    </div>
                    <DialogTitle className="text-2xl">
                        {completion.workout?.name || 'Rutina Finalizada'} - Día {completion.day_number}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 flex items-center justify-center gap-4">
                            <div className="text-center">
                                <h4 className="text-2xl font-bold">{items.length}</h4>
                                <p className="text-xs uppercase tracking-wide opacity-80">Ejercicios</p>
                            </div>
                            <div className="h-8 w-px bg-green-500/20" />
                            <div className="text-center">
                                <h4 className="text-2xl font-bold">{durationMinutes}'</h4>
                                <p className="text-xs uppercase tracking-wide opacity-80">Duración</p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            items.map((item) => {
                                const log = getLogForItem(item.id)
                                return (
                                    <RoutineItemReviewCard
                                        key={item.id}
                                        item={item}
                                        log={log}
                                    />
                                )
                            })
                        )}
                        <div className="h-10" />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function RoutineItemReviewCard({ item, log }: { item: any, log: any }) {
    return (
        <Card className={cn("border-l-4",
            item.block_type === 'Fuerza' ? 'border-l-blue-500' :
                item.block_type === 'Aerobico' ? 'border-l-green-500' : 'border-l-yellow-500'
        )}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{item.block_type}</Badge>
                        </div>
                        <CardTitle className="text-lg">{item.exercises.name}</CardTitle>
                        <CardDescription>{item.exercises.category}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                        <div>{item.sets} x {item.reps}</div>
                        {item.target_rpe > 0 && <div>Meta RPE: {item.target_rpe}</div>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {log ? (
                    <div className="mt-2 text-sm bg-muted/50 p-3 rounded-md border flex items-center gap-4">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <div className="space-y-1">
                            <span className="font-semibold block text-foreground">Tu Registro:</span>
                            <div className="flex gap-4 text-xs">
                                <span>Peso: <b className="text-primary">{log.weight_used || 0} kg</b></span>
                                <span>RPE Real: <b className="text-primary">{log.rpe_actual || '-'}</b></span>
                            </div>
                            {log.notes && (
                                <p className="text-xs text-muted-foreground italic">"{log.notes}"</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-muted-foreground italic pl-2 border-l-2">
                        Sin registro
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
