'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { updateBenchmark, deleteBenchmark } from './actions'
import { Loader2, Pencil, Trash2, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface Log {
    id: string
    exercise_type: string
    weight: number
    date: string
}

interface ManageBenchmarksProps {
    logs: Log[]
    userId: string
}

export function ManageBenchmarks({ logs, userId }: ManageBenchmarksProps) {
    const [openEdit, setOpenEdit] = useState(false)
    const [editingLog, setEditingLog] = useState<Log | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleEditClick = (log: Log) => {
        setEditingLog(log)
        setOpenEdit(true)
    }

    const handleUpdate = async (formData: FormData) => {
        setLoading(true)
        const result = await updateBenchmark(formData)
        setLoading(false)

        if (result?.success) {
            setOpenEdit(false)
            setEditingLog(null)
            router.refresh()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return

        setLoading(true)
        const result = await deleteBenchmark(id)
        setLoading(false)

        if (result?.success) {
            router.refresh()
        }
    }

    return (
        <Card className="mt-6">
            <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-xl flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Historial de Registros
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="rounded-md border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Ejercicio</TableHead>
                                <TableHead>Peso</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No hay registros disponibles.
                                    </TableCell>
                                </TableRow>
                            )}
                            {[...logs]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((log) => {
                                    // Parse YYYY-MM-DD manually to avoid timezone issues
                                    const [year, month, day] = log.date.split('-').map(Number)
                                    const dateObj = new Date(year, month - 1, day)

                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell>{dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.exercise_type}</Badge>
                                            </TableCell>
                                            <TableCell className="font-bold">{log.weight} kg</TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(log)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(log.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Registro</DialogTitle>
                        <DialogDescription>
                            Modificar los valores del testeo.
                        </DialogDescription>
                    </DialogHeader>
                    {editingLog && (
                        <form action={handleUpdate} className="space-y-4">
                            <input type="hidden" name="id" value={editingLog.id} />
                            <div className="space-y-2">
                                <Label htmlFor="exerciseType">Ejercicio</Label>
                                <Select name="exerciseType" defaultValue={editingLog.exercise_type} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sentadilla">Sentadilla</SelectItem>
                                        <SelectItem value="Hip Thrust">Hip Thrust</SelectItem>
                                        <SelectItem value="Banco Plano">Banco Plano</SelectItem>
                                        <SelectItem value="Remo">Remo</SelectItem>
                                        <SelectItem value="Dominadas">Dominadas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Peso (kg)</Label>
                                <Input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    step="0.5"
                                    required
                                    defaultValue={editingLog.weight}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    defaultValue={editingLog.date}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    )
}
