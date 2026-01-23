'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Timer, CheckCircle2, ChevronRight, X, Video } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/utils/supabase/client'
import { completeWorkoutDay, logSet, getLastExerciseLogs } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ActiveRoutineViewer({ routine, day }: { routine: any, day: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isStarted, setIsStarted] = useState(false)
    const [seconds, setSeconds] = useState(0)
    const [items, setItems] = useState<any[]>([])
    const [lastLogs, setLastLogs] = useState<Record<string, any>>({})

    // Unique key for this specific routine + day combination
    const STORAGE_KEY = `workout_timer_${routine.id}_${day}`

    // Check for existing session on open
    useEffect(() => {
        if (isOpen) {
            const storedStart = localStorage.getItem(STORAGE_KEY)
            if (storedStart) {
                const startTime = parseInt(storedStart, 10)
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                setSeconds(elapsed)
                setIsStarted(true)
            }
        }
    }, [isOpen, STORAGE_KEY])

    // Timer Logic
    useEffect(() => {
        let interval: any = null
        if (isStarted && isOpen) {
            interval = setInterval(() => {
                // If we have a start time, use it for accuracy, otherwise just increment (fallback)
                const storedStart = localStorage.getItem(STORAGE_KEY)
                if (storedStart) {
                    const startTime = parseInt(storedStart, 10)
                    setSeconds(Math.floor((Date.now() - startTime) / 1000))
                } else {
                    setSeconds(s => s + 1)
                }
            }, 1000)
        } else {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [isStarted, isOpen, STORAGE_KEY])

    // Format HH:MM:SS
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Fetch items for this day when opening
    useEffect(() => {
        if (isOpen) {
            const fetchItems = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from('workout_items')
                    .select('*, exercises(*)')
                    .eq('workout_id', routine.id)
                    .eq('day_number', day)
                    .order('order_index')

                if (data) {
                    setItems(data)
                    // Fetch last logs for these exercises
                    const exerciseIds = data.map(i => i.exercises.id)
                    getLastExerciseLogs(exerciseIds).then(logs => {
                        setLastLogs(logs)
                    })
                }
            }
            fetchItems()
        }
    }, [isOpen, routine.id, day])

    const handleStart = () => {
        // SET START TIME
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
        setIsStarted(true)
    }

    const handleFinish = async () => {
        if (!confirm('¿Estás seguro de que deseas finalizar la rutina? Se guardará el tiempo transcurrido.')) return

        setIsStarted(false)
        localStorage.removeItem(STORAGE_KEY) // Clear timer

        const res = await completeWorkoutDay(routine.id, day, seconds)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('¡Rutina finalizada!')
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Card className="group cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative">
                    {/* Premium Card Background - Abstract Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <CardHeader>
                        <Badge variant="secondary" className="w-fit mb-2 text-[10px] tracking-wider uppercase">
                            {routine.activity_type}
                        </Badge>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {routine.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Dumbbell className="mr-2 h-4 w-4" />
                            <span>Click para ver detalles</span>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <Button className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground group-hover:shadow-lg transition-all">
                            Ver Rutina <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </DialogTrigger>

            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-2xl">{routine.name} - Día {day}</DialogTitle>
                        <p className="text-muted-foreground text-sm">
                            {isStarted ? "Entrenamiento en curso" : "Listo para comenzar"}
                        </p>
                    </div>
                    {isStarted ? (
                        <div className="flex items-center gap-4">
                            <div className="font-mono text-xl md:text-3xl font-bold tabular-nums text-primary animate-pulse">
                                {formatTime(seconds)}
                            </div>
                            <Button variant="destructive" onClick={handleFinish}>
                                Finalizar
                            </Button>
                        </div>
                    ) : (
                        <Button className="bg-green-600 hover:bg-green-700 text-white px-8" onClick={handleStart}>
                            <Play className="mr-2 h-4 w-4" /> Comenzar
                        </Button>
                    )}
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8 max-w-3xl mx-auto">
                        {!isStarted && (
                            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                                <Timer className="h-10 w-10 text-primary mx-auto mb-2" />
                                <h3 className="font-semibold text-lg">Inicia el temporizador</h3>
                                <p className="text-muted-foreground">Presiona "Comenzar" para habilitar el registro de series y trackear tu tiempo.</p>
                            </div>
                        )}

                        {items.length === 0 ? (
                            <p className="text-center text-muted-foreground">Cargando ejercicios...</p>
                        ) : (
                            items.map((item) => (
                                <RoutineItemCard
                                    key={item.id}
                                    item={item}
                                    isStarted={isStarted}
                                    lastLog={lastLogs[item.exercises.id]}
                                />
                            ))
                        )}

                        <div className="h-20" />

                        {/* DEBUG SECTION - REMOVE AFTER FIX */}
                        <div className="mt-8 p-4 bg-black/80 text-green-400 font-mono text-xs rounded overflow-auto max-h-40">
                            <p className="font-bold mb-2">DEBUG INFO:</p>
                            <pre>{JSON.stringify(lastLogs, null, 2)}</pre>
                            <p className="mt-2">Items Count: {items.length}</p>
                            <p>Exercise IDs: {items.map(i => i.exercises?.id).join(', ')}</p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

interface RoutineItemCardProps {
    item: any
    isStarted: boolean
    lastLog?: any
}

function RoutineItemCard({ item, isStarted, lastLog }: RoutineItemCardProps) {
    const [weight, setWeight] = useState('')
    const [rpe, setRpe] = useState('')
    const [notes, setNotes] = useState('')
    const [isLogged, setIsLogged] = useState(false)

    const handleLog = async () => {
        if (!weight && !rpe && !notes) return

        const formData = new FormData()
        formData.append('exerciseId', item.exercises.id)
        formData.append('workoutItemId', item.id)
        formData.append('weight', weight)
        formData.append('rpe', rpe)
        formData.append('notes', notes)

        const res = await logSet(formData)
        if (res.error) {
            toast.error('Error al guardar registro')
        } else {
            toast.success('Registro guardado')
            setIsLogged(true)
        }
    }

    return (
        <Card className={cn("border-l-4 transition-all",
            isLogged ? "border-green-500 bg-green-50/50" : (
                item.block_type === 'Fuerza' ? 'border-l-blue-500' :
                    item.block_type === 'Aerobico' ? 'border-l-green-500' : 'border-l-yellow-500'
            )
        )}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{item.block_type}</Badge>
                            {item.exercises.video_url && (
                                <a
                                    href={item.exercises.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
                                >
                                    <Video className="h-3 w-3" /> Ver Video
                                </a>
                            )}
                        </div>
                        <CardTitle className="text-lg">{item.exercises.name}</CardTitle>
                        <CardDescription>{item.exercises.category}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{item.sets} Series</div>
                        <div>{item.reps} Reps</div>
                        {item.target_rpe > 0 && <div>RPE {item.target_rpe}</div>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {item.notes && (
                    <div className="mb-4 text-sm bg-muted p-2 rounded italic">
                        "{item.notes}"
                    </div>
                )}

                {lastLog && (
                    <div className="mb-4 text-xs text-muted-foreground border-l-2 p-2 bg-muted/30">
                        <span className="font-semibold text-primary">Último registro:</span> {lastLog.weight_used}kg (RPE {lastLog.rpe_actual})
                        {lastLog.notes && <div className="italic">"{lastLog.notes}"</div>}
                    </div>
                )}

                {isStarted ? (
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4 md:col-span-3">
                            <Label className="text-xs text-muted-foreground">Peso (kg)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                className="h-8"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-3">
                            <Label className="text-xs text-muted-foreground">RPE Real</Label>
                            <Input
                                type="number"
                                placeholder="1-10"
                                value={rpe}
                                onChange={e => setRpe(e.target.value)}
                                className="h-8"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6 flex gap-2">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Notas</Label>
                                <Input
                                    placeholder="Obs..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                            <Button
                                size="sm"
                                className={cn("mt-auto self-end", isLogged ? "bg-green-600 hover:bg-green-700" : "")}
                                onClick={handleLog}
                                disabled={isLogged}
                            >
                                {isLogged ? <CheckCircle2 className="h-4 w-4" /> : "Guardar"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground text-center bg-muted/50 p-2 rounded">
                        Inicia la rutina para registrar actividad
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function Dumbbell({ className, ...props }: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg> }
