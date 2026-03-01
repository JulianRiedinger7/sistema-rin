'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Timer, CheckCircle2, ChevronRight, X, Video, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/utils/supabase/client'
import { completeWorkoutDay, batchLogProgress, getLastExerciseLogs } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ActiveRoutineViewer({ routine, day }: { routine: any, day: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isStarted, setIsStarted] = useState(false)
    const [seconds, setSeconds] = useState(0)
    const [items, setItems] = useState<any[]>([])
    const [lastLogs, setLastLogs] = useState<Record<string, any>>({})
    const [inputs, setInputs] = useState<Record<string, { weight: string, rpe: string, notes: string }>>({})

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
        // Confirmation handled by UI
        // if (!confirm('¿Estás seguro de que deseas finalizar la rutina? Se guardará el tiempo transcurrido y las cargas ingresadas.')) return

        setIsStarted(false)
        localStorage.removeItem(STORAGE_KEY) // Clear timer

        // 1. Collect Valid Inputs
        const logsToSave = []
        for (const itemId in inputs) {
            const input = inputs[itemId]
            if (input.weight || input.rpe || input.notes) {
                const item = items.find(i => i.id === itemId)
                if (item) {
                    logsToSave.push({
                        exerciseId: item.exercises.id,
                        workoutItemId: itemId,
                        weight: Number(input.weight) || 0,
                        rpe: Number(input.rpe) || 0,
                        notes: input.notes || ''
                    })
                }
            }
        }

        // 2. Batch Save
        console.log('Sending logs to save:', logsToSave)
        if (logsToSave.length > 0) {
            const batchRes = await batchLogProgress(logsToSave)
            if (batchRes?.error) {
                toast.error(batchRes.error)
                return
            }
            if (batchRes?.success) {
                toast.success(`Se guardaron ${logsToSave.length} registros de peso/RPE.`)
            }
        } else {
            toast.info("No se detectaron cargas para guardar.")
        }

        const res = await completeWorkoutDay(routine.id, day, seconds)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('¡Rutina finalizada!')
            setIsOpen(false)
        }
    }

    const handleInputChange = (itemId: string, field: 'weight' | 'rpe' | 'notes', value: string) => {
        setInputs(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId] || { weight: '', rpe: '', notes: '' },
                [field]: value
            }
        }))
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
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        Finalizar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Finalizar Rutina?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Se guardará el tiempo transcurrido ({formatTime(seconds)}) y todas las cargas/notas ingresadas.
                                            Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleFinish} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Confirmar y Finalizar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ) : (
                        <Button className="bg-green-600 hover:bg-green-700 text-white px-8" onClick={handleStart}>
                            <Play className="mr-2 h-4 w-4" /> Comenzar
                        </Button>
                    )}
                </DialogHeader>

                {/* PDF Banner */}
                {routine.pdf_url && (
                    <div className="px-6 py-3 border-b shrink-0">
                        <a
                            href={routine.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors group"
                        >
                            <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                                <FileText className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">PDF de Rutina disponible</p>
                                <p className="text-xs text-muted-foreground">Toca para abrir el documento</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </a>
                    </div>
                )}

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
                                    inputs={inputs[item.id] || { weight: '', rpe: '', notes: '' }}
                                    onInputChange={(field, val) => handleInputChange(item.id, field, val)}
                                />
                            ))
                        )}

                        <div className="h-20" />

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
    inputs: { weight: string, rpe: string, notes: string }
    onInputChange: (field: 'weight' | 'rpe' | 'notes', value: string) => void
}

function RoutineItemCard({ item, isStarted, lastLog, inputs, onInputChange }: RoutineItemCardProps) {

    return (
        <Card className={cn("border-l-4 transition-all",
            (
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
                        <span className="font-semibold text-primary">Última vez:</span> {lastLog.weight_used}kg (RPE {lastLog.rpe_actual})
                    </div>
                )}

                {isStarted && (
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4 md:col-span-3">
                            <Label className="text-xs text-muted-foreground">Peso (kg)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={inputs.weight}
                                onChange={e => onInputChange('weight', e.target.value)}
                                className="h-8"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-3">
                            <Label className="text-xs text-muted-foreground">RPE</Label>
                            <Input
                                type="number"
                                placeholder="-"
                                value={inputs.rpe}
                                onChange={e => onInputChange('rpe', e.target.value)}
                                className="h-8"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <Label className="text-xs text-muted-foreground">Notas</Label>
                            <Input
                                placeholder="Obs..."
                                value={inputs.notes}
                                onChange={e => onInputChange('notes', e.target.value)}
                                className="h-8"
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function Dumbbell({ className, ...props }: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg> }
