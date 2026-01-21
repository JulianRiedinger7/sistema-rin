'use client'

import { Button } from '@/components/ui/button'
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
import { addBenchmark } from './actions'
import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddBenchmarkDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        const result = await addBenchmark(formData)
        setLoading(false)

        if (result?.success) {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Registrar Nuevo Testeo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Testeo de Fuerza</DialogTitle>
                    <DialogDescription>
                        Ingresa el peso máximo (1RM) o testeo realizado.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="exerciseType">Ejercicio</Label>
                        <Select name="exerciseType" required>
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
                        <Input id="weight" name="weight" type="number" step="0.5" required placeholder="Ej: 80" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
