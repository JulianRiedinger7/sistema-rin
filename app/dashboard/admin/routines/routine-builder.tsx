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
import { Check, Trash2, Plus, FileUp, FileText, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createRoutine, uploadRoutinePdf } from './actions'
import { useRouter } from 'next/navigation'

// Types
interface Exercise {
    id: string
    name: string
    category: string
    muscle_group?: string
}

interface BlockItem {
    exercise_id: string
    exercise_name: string
    exercise_category: string
    sets: number
    reps: string
    target_rpe: number
    notes: string
}

interface Block {
    id: string
    name: string
    items: BlockItem[]
}

interface DayData {
    blocks: Block[]
}

const BLOCK_COLORS: Record<string, string> = {
    'Fuerza': 'border-l-blue-500',
    'Aerobico': 'border-l-green-500',
    'Potencia': 'border-l-red-500',
    'Movilidad': 'border-l-yellow-500',
}

const BLOCK_SUGGESTIONS = ['Fuerza', 'Aerobico', 'Potencia', 'Movilidad', 'Calentamiento', 'Core', 'Elongacion']

function getBlockColor(name: string): string {
    return BLOCK_COLORS[name] || 'border-l-purple-500'
}

function generateBlockId(): string {
    return Math.random().toString(36).substring(2, 9)
}

export default function RoutineBuilder({ exercises }: { exercises: Exercise[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Global Settings
    const [activityType, setActivityType] = useState<string>('gym')
    const [name, setName] = useState('')
    const [globalStructure, setGlobalStructure] = useState('')
    const [globalRpe, setGlobalRpe] = useState('')
    const [notes, setNotes] = useState('')
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [uploadingPdf, setUploadingPdf] = useState(false)

    // 5-Day Structure State
    const [activeDay, setActiveDay] = useState(1)

    // Days data: each day has an ordered array of blocks
    const [days, setDays] = useState<Record<number, DayData>>({
        1: { blocks: [] },
        2: { blocks: [] },
        3: { blocks: [] },
        4: { blocks: [] },
        5: { blocks: [] },
    })

    // Exercise selection state
    const [openDialog, setOpenDialog] = useState(false)
    const [targetBlockId, setTargetBlockId] = useState<string | null>(null)

    // New block creation state
    const [showNewBlockInput, setShowNewBlockInput] = useState(false)
    const [newBlockName, setNewBlockName] = useState('')

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

    // Current day data
    const currentDayData = days[activeDay]

    // Sync global structure to Fuerza items
    useEffect(() => {
        const structure = parseStructure(globalStructure)
        const rpeNum = globalRpe ? parseFloat(globalRpe) : null

        setDays(prev => {
            const updated = { ...prev }
            for (const dayNum of [1, 2, 3, 4, 5]) {
                const dayData = { ...updated[dayNum] }
                dayData.blocks = dayData.blocks.map(block => {
                    if (block.name !== 'Fuerza') return block
                    return {
                        ...block,
                        items: block.items.map(item => {
                            const changes: Partial<BlockItem> = {}
                            if (structure) {
                                changes.sets = structure.sets
                                changes.reps = globalStructure
                            }
                            if (rpeNum !== null && !isNaN(rpeNum)) {
                                changes.target_rpe = rpeNum
                            }
                            return { ...item, ...changes }
                        })
                    }
                })
                updated[dayNum] = dayData
            }
            return updated
        })
    }, [globalStructure, globalRpe])

    // ---- Block Management ----

    const handleAddBlock = () => {
        const trimmed = newBlockName.trim()
        if (!trimmed) return

        setDays(prev => {
            const dayData = { ...prev[activeDay] }
            dayData.blocks = [...dayData.blocks, {
                id: generateBlockId(),
                name: trimmed,
                items: [],
            }]
            return { ...prev, [activeDay]: dayData }
        })

        setNewBlockName('')
        setShowNewBlockInput(false)
    }

    const handleRemoveBlock = (blockId: string) => {
        setDays(prev => {
            const dayData = { ...prev[activeDay] }
            dayData.blocks = dayData.blocks.filter(b => b.id !== blockId)
            return { ...prev, [activeDay]: dayData }
        })
    }

    const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
        setDays(prev => {
            const dayData = { ...prev[activeDay] }
            const blocks = [...dayData.blocks]
            const idx = blocks.findIndex(b => b.id === blockId)
            if (idx === -1) return prev
            if (direction === 'up' && idx === 0) return prev
            if (direction === 'down' && idx === blocks.length - 1) return prev

            const swapIdx = direction === 'up' ? idx - 1 : idx + 1
            const temp = blocks[idx]
            blocks[idx] = blocks[swapIdx]
            blocks[swapIdx] = temp

            dayData.blocks = blocks
            return { ...prev, [activeDay]: dayData }
        })
    }

    // ---- Exercise Management ----

    const openSearch = (blockId: string) => {
        setTargetBlockId(blockId)
        setOpenDialog(true)
    }

    const handleAddExercise = (exerciseId: string) => {
        if (!targetBlockId) return

        const exercise = exercises.find(e => e.id === exerciseId)
        if (!exercise) return

        setDays(prev => {
            const dayData = { ...prev[activeDay] }
            dayData.blocks = dayData.blocks.map(block => {
                if (block.id !== targetBlockId) return block

                const isFuerza = block.name === 'Fuerza'
                const useGlobalConfig = isFuerza && !!globalStructure

                let defaultRpe = 7
                if (isFuerza && globalRpe) {
                    const parsed = parseFloat(globalRpe)
                    if (!isNaN(parsed)) defaultRpe = parsed
                }

                return {
                    ...block,
                    items: [...block.items, {
                        exercise_id: exercise.id,
                        exercise_name: exercise.name,
                        exercise_category: exercise.category,
                        sets: useGlobalConfig && structurePreview ? structurePreview.sets : 3,
                        reps: useGlobalConfig ? globalStructure : '10',
                        target_rpe: defaultRpe,
                        notes: '',
                    }]
                }
            })
            return { ...prev, [activeDay]: dayData }
        })
        setOpenDialog(false)
        setTargetBlockId(null)
    }

    const handleUpdateItem = (blockId: string, itemIndex: number, field: string, value: any) => {
        setDays(prev => {
            const dayData = { ...prev[activeDay] }
            dayData.blocks = dayData.blocks.map(block => {
                if (block.id !== blockId) return block
                const items = [...block.items]
                items[itemIndex] = { ...items[itemIndex], [field]: value }
                return { ...block, items }
            })
            return { ...prev, [activeDay]: dayData }
        })
    }

    const handleRemoveItem = (blockId: string, itemIndex: number) => {
        setDays(prev => {
            const dayData = { ...prev[activeDay] }
            dayData.blocks = dayData.blocks.map(block => {
                if (block.id !== blockId) return block
                return { ...block, items: block.items.filter((_, i) => i !== itemIndex) }
            })
            return { ...prev, [activeDay]: dayData }
        })
    }

    // ---- PDF ----
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
    }

    // ---- Submit ----
    const handleSubmit = async () => {
        if (!activityType || !name) {
            alert("Por favor completa el nombre y selecciona una actividad.")
            return
        }

        // Flatten all blocks into items with order_index and block_index
        const allItems: any[] = []
        for (const dayNum of [1, 2, 3, 4, 5]) {
            let orderCounter = 0
            let blockCounter = 0
            const dayData = days[dayNum]
            for (const block of dayData.blocks) {
                for (const item of block.items) {
                    allItems.push({
                        exercise_id: item.exercise_id,
                        sets: Number(item.sets),
                        reps: String(item.reps),
                        target_rpe: Number(item.target_rpe),
                        notes: item.notes,
                        order_index: orderCounter++,
                        day_number: dayNum,
                        block_type: block.name,
                        block_index: blockCounter,
                    })
                }
                blockCounter++
            }
        }

        if (allItems.length === 0) {
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
            items: allItems,
        })

        if (result.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push('/dashboard/admin/routines')
        }
    }

    // Count total items for a day
    const getDayItemCount = (dayNum: number) => {
        return days[dayNum].blocks.reduce((sum, b) => sum + b.items.length, 0)
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
                                <Label>Actividad</Label>
                                <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                                    <span className="text-sm font-medium text-primary">Gimnasio</span>
                                </div>
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
                {[1, 2, 3, 4, 5].map(day => {
                    const itemCount = getDayItemCount(day)
                    return (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2",
                                activeDay === day
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Día {day}
                            {itemCount > 0 && (
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full",
                                    activeDay === day ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    {itemCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Daily Content - Dynamic Blocks */}
            <div className="space-y-6 animate-in fade-in duration-300">
                {currentDayData.blocks.length === 0 && !showNewBlockInput && (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground mb-4">
                            No hay bloques para el Día {activeDay}. ¡Creá el primero!
                        </p>
                        <Button onClick={() => setShowNewBlockInput(true)} variant="outline" size="lg">
                            <Plus className="mr-2 h-5 w-5" /> Agregar Bloque
                        </Button>
                    </div>
                )}

                {currentDayData.blocks.map((block, blockIndex) => {
                    const enforceGlobal = block.name === 'Fuerza' && !!globalStructure

                    return (
                        <Card key={block.id} className={cn("border-l-4", getBlockColor(block.name))}>
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {block.name}
                                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        {block.items.length} ejercicios
                                    </span>
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        disabled={blockIndex === 0}
                                        onClick={() => handleMoveBlock(block.id, 'up')}
                                        title="Mover arriba"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        disabled={blockIndex === currentDayData.blocks.length - 1}
                                        onClick={() => handleMoveBlock(block.id, 'down')}
                                        title="Mover abajo"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openSearch(block.id)}>
                                        <Plus className="mr-2 h-4 w-4" /> Agregar
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveBlock(block.id)}
                                        title="Eliminar bloque"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {block.items.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                                        Sin ejercicios — usá el botón "Agregar" para incluir ejercicios
                                    </div>
                                ) : (
                                    block.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-muted/20 border border-border items-start md:items-end">
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
                                                        onChange={(e) => handleUpdateItem(block.id, itemIndex, 'sets', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Reps/Tiempo</Label>
                                                    <Input
                                                        className="h-8 w-24"
                                                        value={item.reps}
                                                        disabled={enforceGlobal}
                                                        placeholder="10/10/8"
                                                        onChange={(e) => handleUpdateItem(block.id, itemIndex, 'reps', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">RPE</Label>
                                                    <Input
                                                        className="h-8 w-16"
                                                        type="number"
                                                        value={item.target_rpe}
                                                        onChange={(e) => handleUpdateItem(block.id, itemIndex, 'target_rpe', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Notas</Label>
                                                    <Input
                                                        className="h-8 w-32"
                                                        value={item.notes}
                                                        placeholder="Notas..."
                                                        onChange={(e) => handleUpdateItem(block.id, itemIndex, 'notes', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveItem(block.id, itemIndex)}
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

                {/* Add Block Section */}
                {showNewBlockInput ? (
                    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                        <CardContent className="py-4 space-y-3">
                            <Label className="font-semibold">Nombre del Bloque</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Fuerza, Aerobico, Core..."
                                    value={newBlockName}
                                    onChange={(e) => setNewBlockName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddBlock() }}
                                    autoFocus
                                />
                                <Button onClick={handleAddBlock} disabled={!newBlockName.trim()}>
                                    <Plus className="mr-2 h-4 w-4" /> Crear
                                </Button>
                                <Button variant="ghost" onClick={() => { setShowNewBlockInput(false); setNewBlockName('') }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            {/* Quick suggestions */}
                            <div className="flex flex-wrap gap-2">
                                {BLOCK_SUGGESTIONS.filter(s =>
                                    !currentDayData.blocks.some(b => b.name === s)
                                ).map(suggestion => (
                                    <button
                                        key={suggestion}
                                        className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                                        onClick={() => setNewBlockName(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    currentDayData.blocks.length > 0 && (
                        <Button
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => setShowNewBlockInput(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Agregar Bloque
                        </Button>
                    )
                )}
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
                                                "opacity-0"
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
