'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { Check, ChevronsUpDown, Trash2, Plus, GripVertical, FileUp, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createRoutine, uploadRoutinePdf } from './actions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Types
interface Student {
    id: string
    full_name: string
}

interface Exercise {
    id: string
    name: string
    category: string
    muscle_group?: string
}

// Props
interface RoutineBuilderProps {
    exercises: Exercise[]
}

export default function RoutineBuilder({ exercises }: { exercises: Exercise[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Global Settings
    const [activityType, setActivityType] = useState<string>('')
    const [name, setName] = useState('')
    const [globalStructure, setGlobalStructure] = useState('')
    const [globalRpe, setGlobalRpe] = useState('')
    const [notes, setNotes] = useState('')
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [uploadingPdf, setUploadingPdf] = useState(false)

    // 5-Day Structure State
    const [activeDay, setActiveDay] = useState(1) // 1-5

    // Items state
    const [items, setItems] = useState<any[]>([])

    // Exercise selection state
    const [openDialog, setOpenDialog] = useState(false) // Changed to Dialog
    const [targetBlockForAdd, setTargetBlockForAdd] = useState<'Fuerza' | 'Aerobico' | 'Potencia' | 'Movilidad' | null>(null)

    // Helper to parse global structure
    const parseStructure = (str: string) => {
        if (!str) return null
        const parts = str.split('/').map(s => s.trim()).filter(s => s !== '')
        if (parts.length === 0) return null
        return {
            valid: true,
            sets: parts.length,
            preview: parts.join(' - ')
        }
    }

    const structurePreview = parseStructure(globalStructure)

    // Sync items with global settings
    useEffect(() => {
        const structure = parseStructure(globalStructure)
        const rpeNum = globalRpe ? parseFloat(globalRpe) : null

        setItems(prev => prev.map(item => {
            if (item.block_type !== 'Fuerza') return item

            const changes: any = {}

            // Sync structure if valid
            if (structure) {
                changes.sets = structure.sets
                changes.reps = globalStructure
            }

            // Sync RPE if global is set and parsable (or strictly if existing)
            // If the user wants global RPE to override individual, we update it.
            if (!isNaN(rpeNum!) && rpeNum !== null) {
                changes.target_rpe = rpeNum
            } else if (globalRpe && item.target_rpe === 0) {
                // heuristic: if it was 0 (defaulted) and now global is cleared/changed?
            }

            return { ...item, ...changes }
        }))
    }, [globalStructure, globalRpe]) // Dependencies: run when these change

    const handleAddExercise = (exerciseId: string) => {
        if (!targetBlockForAdd) return

        const exercise = exercises.find(e => e.id === exerciseId)
        if (!exercise) return

        const isFuerza = targetBlockForAdd === 'Fuerza'
        const useGlobalConfig = isFuerza && !!globalStructure

        // Parse global RPE for default
        let defaultRpe = 7
        if (isFuerza && globalRpe) {
            const parsed = parseFloat(globalRpe)
            if (!isNaN(parsed)) defaultRpe = parsed
        }

        setItems([...items, {
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            exercise_category: exercise.category,
            day_number: activeDay,
            block_type: targetBlockForAdd,
            // If Fuerza and Global Structure exists, enforce it
            sets: useGlobalConfig && structurePreview ? structurePreview.sets : 3,
            reps: useGlobalConfig ? globalStructure : '10',
            target_rpe: defaultRpe,
            notes: '',
            order_index: items.length
        }])
        setOpenDialog(false)
        setTargetBlockForAdd(null)
    }

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const openSearch = (block: 'Fuerza' | 'Aerobico' | 'Potencia' | 'Movilidad') => {
        setTargetBlockForAdd(block)
        setOpenDialog(true)
    }

    // Filter items for current view
    const getItemsForDayAndBlock = (day: number, block: string) => {
        return items
            .map((item, originalIndex) => ({ ...item, originalIndex }))
            .filter(item => item.day_number === day && item.block_type === block)
    }

    const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert('Solo se permiten archivos PDF')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo no puede superar los 10MB')
            return
        }

        setPdfFile(file)
    }

    const handleRemovePdf = () => {
        setPdfFile(null)
        setPdfUrl(null)
    }

    const handleSubmit = async () => {
        if (!activityType || !name) {
            alert("Por favor completa el nombre y selecciona una actividad.")
            return
        }

        if (items.length === 0) {
            alert("Debes agregar al menos un ejercicio a la rutina.")
            return
        }

        setLoading(true)

        // Upload PDF if selected
        let finalPdfUrl: string | undefined = undefined
        if (pdfFile) {
            setUploadingPdf(true)
            const formData = new FormData()
            formData.append('file', pdfFile)
            const uploadResult = await uploadRoutinePdf(formData)
            setUploadingPdf(false)

            if (uploadResult.error) {
                alert(uploadResult.error)
                setLoading(false)
                return
            }
            finalPdfUrl = uploadResult.url
        }

        const result = await createRoutine({
            activity_type: activityType,
            name,
            notes,
            global_structure: globalStructure,
            global_rpe: globalRpe,
            pdf_url: finalPdfUrl,
            items: items.map((item, idx) => ({
                exercise_id: item.exercise_id,
                sets: Number(item.sets),
                reps: String(item.reps), // Ensure string
                target_rpe: Number(item.target_rpe),
                notes: item.notes,
                order_index: idx,
                day_number: item.day_number,
                block_type: item.block_type
            }))
        })

        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push('/dashboard/admin/routines')
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración Global</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Actividad *</Label>
                                <Select onValueChange={setActivityType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gym">Gimnasio</SelectItem>
                                        <SelectItem value="pilates">Pilates</SelectItem>
                                        <SelectItem value="mixed">Mixto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Nombre Rutina *</Label>
                                <Input
                                    placeholder="Ej: Semana 1"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm text-primary">Estructura Semanal Defecto</h4>
                                {structurePreview && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                        {structurePreview.sets} Series: {structurePreview.preview}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Series y Repeticiones (Separadas por /)</Label>
                                    <Input
                                        placeholder="Ej: 10/10/8/8/6"
                                        value={globalStructure}
                                        onChange={(e) => setGlobalStructure(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Intensidad (RPE Global)</Label>
                                    <Input
                                        placeholder="Ej: 7-8"
                                        value={globalRpe}
                                        onChange={(e) => setGlobalRpe(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Esta estructura se aplicará automáticamente y bloqueará la edición en los ejercicios de Fuerza.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notas Generales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            className="min-h-[120px]"
                            placeholder="Instrucciones generales para toda la semana..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />

                        {/* PDF Upload Section */}
                        <div className="border-t border-border pt-4">
                            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-red-500" />
                                PDF Adjunto (opcional)
                            </Label>
                            {pdfFile ? (
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                                    <div className="p-2 bg-red-500/10 rounded">
                                        <FileText className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={handleRemovePdf}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                                    <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Click para seleccionar un PDF</span>
                                    <span className="text-xs text-muted-foreground mt-1">Máximo 10MB</span>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={handlePdfSelect}
                                    />
                                </label>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Day Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
                {[1, 2, 3, 4, 5].map(day => (
                    <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={cn(
                            "px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2",
                            activeDay === day
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        Día {day}
                    </button>
                ))}
            </div>

            {/* Daily Content */}
            <div className="space-y-8 animate-in fade-in duration-300">
                {['Fuerza', 'Aerobico', 'Potencia', 'Movilidad'].map((block) => {
                    const blockItems = getItemsForDayAndBlock(activeDay, block)
                    // Check if this block should enforce global structure
                    const enforceGlobal = block === 'Fuerza' && !!globalStructure

                    return (
                        <Card key={block} className={cn("border-l-4",
                            block === 'Fuerza' ? 'border-l-blue-500' :
                                block === 'Aerobico' ? 'border-l-green-500' :
                                    block === 'Potencia' ? 'border-l-red-500' : 'border-l-yellow-500'
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {block}
                                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        {blockItems.length} ejercicios
                                    </span>
                                </CardTitle>
                                <Button size="sm" variant="outline" onClick={() => openSearch(block as any)}>
                                    <Plus className="mr-2 h-4 w-4" /> Agregar
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {blockItems.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                                        Sin ejercicios de {block} para el Día {activeDay}
                                    </div>
                                ) : (
                                    blockItems.map((item) => (
                                        <div key={item.originalIndex} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-muted/20 border border-border items-start md:items-end">
                                            <div className="flex-1">
                                                <p className="font-medium text-primary">{item.exercise_name}</p>
                                                <p className="text-xs text-muted-foreground">{item.exercise_category}</p>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 w-full md:w-auto">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Series</Label>
                                                    <Input
                                                        className="h-8 w-20"
                                                        type="number"
                                                        value={item.sets}
                                                        disabled={enforceGlobal}
                                                        onChange={(e) => handleUpdateItem(item.originalIndex, 'sets', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Reps/Tiempo</Label>
                                                    <Input
                                                        className="h-8 w-24"
                                                        value={item.reps}
                                                        disabled={enforceGlobal}
                                                        placeholder="10/10/8"
                                                        onChange={(e) => handleUpdateItem(item.originalIndex, 'reps', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">RPE</Label>
                                                    <Input
                                                        className="h-8 w-16"
                                                        type="number"
                                                        value={item.target_rpe}
                                                        onChange={(e) => handleUpdateItem(item.originalIndex, 'target_rpe', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Notas</Label>
                                                    <Input
                                                        className="h-8 w-32"
                                                        value={item.notes}
                                                        placeholder="Notas..."
                                                        onChange={(e) => handleUpdateItem(item.originalIndex, 'notes', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveItem(item.originalIndex)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Exercise Selector Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="p-0 sm:max-w-[425px]">
                    <DialogTitle className="sr-only">Seleccionar ejercicio</DialogTitle>
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Buscar ejercicio..." />
                        <CommandList>
                            <CommandEmpty>No encontrado.</CommandEmpty>
                            <CommandGroup heading="Ejercicios Disponibles">
                                {exercises.map((exercise) => (
                                    <CommandItem
                                        key={exercise.id}
                                        value={exercise.name}
                                        onSelect={() => handleAddExercise(exercise.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span>{exercise.name}</span>
                                            <span className="text-xs text-muted-foreground">{exercise.category}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                items.some(i => i.exercise_id === exercise.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>

            <div className="fixed bottom-6 right-6 z-50">
                <Button size="lg" onClick={handleSubmit} disabled={loading} className="shadow-2xl rounded-full px-8 py-6 text-lg bg-green-600 hover:bg-green-700">
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {uploadingPdf ? 'Subiendo PDF...' : 'Guardar Rutina Completa'}
                </Button>
            </div>
            <div className="h-20" /> {/* Spacer */}
        </div>
    )
}
