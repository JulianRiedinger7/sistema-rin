'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Loader2, Save, RotateCcw, User } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { getStudents, saveTestResult } from './actions'
import Link from 'next/link'

// Type definitions
interface Student {
    id: string
    full_name: string
    dni: string
}

const EXERCISES = [
    { id: 'Sentadilla', label: 'Sentadilla' },
    { id: 'Hip Thrust', label: 'Hip Thrust' },
    { id: 'Banco Plano', label: 'Press Banco Plano' },
    { id: 'Remo', label: 'Remo' },
    { id: 'Dominadas', label: 'Dominadas' },
]

const BORG_SCALE = [
    { zone: 10, label: 'Máximo', desc: 'Esfuerzo máximo posible.', color: 'bg-red-50 text-red-900 border-red-100' },
    { zone: 9, label: 'Muy Duro', desc: 'Casi al fallo, 1 repetición más.', color: 'bg-red-50 text-red-900 border-red-100' },
    { zone: 8, label: 'Duro', desc: 'Podrías hacer 2 repeticiones más.', color: 'bg-orange-50 text-orange-900 border-orange-100' },
    { zone: 7, label: 'Vigoroso', desc: 'Podrías hacer 3 repeticiones más.', color: 'bg-yellow-50 text-yellow-900 border-yellow-100' },
    { zone: 6, label: 'Moderado+', desc: 'Movimiento rápido, algo de fatiga.', color: 'bg-lime-50 text-lime-900 border-lime-100' },
    { zone: 5, label: 'Moderado', desc: 'Entrada en calor pesada.', color: 'bg-green-50 text-green-900 border-green-100' },
    { zone: 4, label: 'Suave', desc: 'Recuperación activa.', color: 'bg-slate-50 text-slate-900 border-slate-200' },
    { zone: 3, label: 'Muy Suave', desc: 'Movimiento sin carga.', color: 'bg-slate-50 text-slate-900 border-slate-200' },
    { zone: 2, label: 'Extremadamente Suave', desc: '', color: 'bg-slate-50 text-slate-900 border-slate-200' },
    { zone: 1, label: 'Reposo', desc: '', color: 'bg-slate-50 text-slate-900 border-slate-200' },
]

export default function TesteosPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [selectedStudent, setSelectedStudent] = useState<string>('')
    const [selectedExercise, setSelectedExercise] = useState<string>('Sentadilla')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [maxWeight, setMaxWeight] = useState<string>('100')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true)
            const data = await getStudents()
            setStudents(data || [])
            setLoading(false)
        }
        fetchStudents()
    }, [])

    const handleSave = async () => {
        if (!selectedStudent || !selectedExercise || !maxWeight || !date) {
            setMessage({ type: 'error', text: 'Todos los campos son obligatorios.' })
            return
        }

        setSaving(true)
        setMessage(null)

        const result = await saveTestResult(
            selectedStudent,
            selectedExercise,
            parseFloat(maxWeight),
            date
        )

        if (result.success) {
            setMessage({ type: 'success', text: 'Test guardado correctamente.' })
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al guardar.' })
        }
        setSaving(false)
    }

    const calculateWeight = (zone: number) => {
        const max = parseFloat(maxWeight) || 0
        const weight = max * (zone / 10)
        return Math.round(weight * 10) / 10
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Testeos de Fuerza</h1>
                <p className="text-muted-foreground">
                    Registra el RM y calcula las zonas de entrenamiento.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Form Section - Takes 1/3 on large screens */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nuevo Registro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Alumno</Label>
                                <div className="flex gap-2">
                                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar alumno..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={!selectedStudent}
                                        asChild={!!selectedStudent}
                                        title="Ir al perfil"
                                        className="shrink-0"
                                    >
                                        {selectedStudent ? (
                                            <Link href={`/dashboard/admin/users/${selectedStudent}`}>
                                                <User className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <User className="h-4 w-4 opacity-50" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Ejercicio</Label>
                                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXERCISES.map((ex) => (
                                            <SelectItem key={ex.id} value={ex.id}>
                                                {ex.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>{selectedExercise === 'Dominadas' ? 'Repeticiones' : 'Peso Máximo (kg)'}</Label>
                                <Input
                                    type="number"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                    placeholder={selectedExercise === 'Dominadas' ? "Ej: 10" : "Ej: 100"}
                                    className="text-lg font-medium"
                                />
                            </div>

                            {message && (
                                <div className={cn(
                                    "p-3 rounded-md text-sm text-center",
                                    message.type === 'success' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                )}>
                                    {message.text}
                                </div>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section - Takes 2/3 on large screens */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Tabla de Cargas</span>
                                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {selectedExercise}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <div className="min-w-[700px]">
                                        <div className="grid grid-cols-12 border-b bg-muted/50 p-3 font-medium text-sm">
                                            <div className="col-span-2 text-center">Zona</div>
                                            <div className="col-span-3 text-center">Peso</div>
                                            <div className="col-span-2">Esfuerzo</div>
                                            <div className="col-span-5">Descripción</div>
                                        </div>
                                        <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
                                            {BORG_SCALE.map((item) => (
                                                <div
                                                    key={item.zone}
                                                    className={cn(
                                                        "grid grid-cols-12 items-center p-3 text-sm border-b last:border-0",
                                                        "hover:bg-muted/50 transition-colors"
                                                    )}
                                                >
                                                    <div className="col-span-2 text-center font-bold text-lg">{item.zone}</div>
                                                    <div className="col-span-3 text-center font-mono font-bold text-base">
                                                        {calculateWeight(item.zone)} {selectedExercise === 'Dominadas' ? 'reps' : 'kg'}
                                                    </div>
                                                    <div className="col-span-2 font-medium">{item.label}</div>
                                                    <div className="col-span-5 text-muted-foreground text-xs">{item.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
