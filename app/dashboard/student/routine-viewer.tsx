'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { logSet, completeWorkout } from './actions'
import { Loader2, CheckCircle2, Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface WorkoutItem {
    id: string
    sets: number
    reps: number
    target_rpe: number
    notes: string
    exercise: {
        id: string
        name: string
        category: string
        video_url?: string
    }
}

interface Workout {
    id: string
    name: string
    items: WorkoutItem[]
}

export function RoutineViewer({ workout }: { workout: Workout }) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
    const [completing, setCompleting] = useState(false)
    const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({})

    const handleLog = async (itemId: string, formData: FormData) => {
        setLoadingMap(prev => ({ ...prev, [itemId]: true }))
        await logSet(formData)
        setLoadingMap(prev => ({ ...prev, [itemId]: false }))
        setCompletedItems(prev => ({ ...prev, [itemId]: true }))
        // Could show a toast here
    }

    const handleFinish = async () => {
        setCompleting(true)
        await completeWorkout(workout.id)
        // Redirect handled by server action revalidate/redirect or we can do it here
        setCompleting(false)
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">{workout.name}</h2>
                <Badge variant="outline">{workout.items.length} Ejercicios</Badge>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {workout.items.map((item, index) => (
                    <AccordionItem key={item.id} value={item.id} className="border border-border rounded-lg bg-card px-2">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                                {completedItems[item.id] ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                )}
                                <div>
                                    <p className="font-semibold">{item.exercise.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.sets} x {item.reps} @ RPE {item.target_rpe}</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            {item.exercise.video_url && (
                                <a
                                    href={item.exercise.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-500 hover:underline block mb-2"
                                >
                                    Ver Video Demostración
                                </a>
                            )}

                            <div className="bg-muted/50 p-3 rounded-md text-sm border border-border/50">
                                <span className="font-semibold text-primary">Instrucciones:</span> {item.notes || "Sin instrucciones especiales."}
                            </div>

                            <form action={(fd) => handleLog(item.id, fd)} className="space-y-3">
                                <input type="hidden" name="exerciseId" value={item.exercise.id} />
                                <input type="hidden" name="workoutItemId" value={item.id} />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Peso (kg)</Label>
                                        <Input type="number" name="weight" placeholder="0" step="0.5" required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">RPE Real</Label>
                                        <Input type="number" name="rpe" placeholder="7" required />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Notas</Label>
                                    <Input name="notes" placeholder="Sensaciones..." />
                                </div>

                                <Button className="w-full" size="sm" disabled={loadingMap[item.id]}>
                                    {loadingMap[item.id] && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    Registrar Serie / Ejercicio
                                </Button>
                            </form>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <div className="fixed bottom-4 left-4 right-4 md:static md:w-full">
                <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    onClick={handleFinish}
                    disabled={completing}
                >
                    {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finalizar Entrenamiento
                </Button>
            </div>
        </div>
    )
}
