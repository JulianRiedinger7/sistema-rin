'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { registerPayment } from './actions'
import { Loader2, Plus, CalendarIcon } from 'lucide-react'

interface Student {
    id: string
    full_name: string
}

// ACTIVITY_PRICES removed in favor of DB prices passed as props

export function RegisterPaymentDialog({ students, pricedActivities }: { students: Student[], pricedActivities: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<string>('')
    const [amount, setAmount] = useState('')

    // Transform pricedActivities to a map for easy lookup
    const priceMap = pricedActivities.reduce((acc, curr) => {
        acc[curr.activity_type] = curr.price
        return acc
    }, {} as Record<string, number>)

    // Auto-set amount when activity changes
    const handleActivityChange = (val: string) => {
        setSelectedActivity(val)
        if (priceMap[val]) {
            setAmount(priceMap[val].toString())
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        await registerPayment(formData)
        setLoading(false)
        setOpen(false)
        // Reset state
        setSelectedActivity('')
        setAmount('')
    }

    // Fix: Defaults to today's date in local time (YYYY-MM-DD) instead of UTC
    const now = new Date()
    const today = now.toLocaleDateString('en-CA') // YYYY-MM-DD in local time

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Registrar Pago
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Pago Manual</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 pt-4">
                    {/* Alumno */}
                    <div className="space-y-2">
                        <Label>Alumno</Label>
                        <Select name="userId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar alumno..." />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.full_name || 'Sin Nombre'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Actividad */}
                    <div className="space-y-2">
                        <Label>Actividad</Label>
                        <input type="hidden" name="activity" value={selectedActivity} />
                        <Select value={selectedActivity} required onValueChange={handleActivityChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar actividad..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gym">Gimnasio</SelectItem>
                                <SelectItem value="pilates">Pilates</SelectItem>
                                <SelectItem value="mixed">Mixto (Gym + Pilates)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Fecha */}
                        <div className="space-y-2">
                            <Label>Fecha de Pago</Label>
                            <div className="relative">
                                <Input type="date" name="date" defaultValue={today} required />
                            </div>
                        </div>

                        {/* Metodo */}
                        <div className="space-y-2">
                            <Label>Método</Label>
                            <Select name="method" defaultValue="cash" required>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Efectivo</SelectItem>
                                    <SelectItem value="transfer">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Monto */}
                    <div className="space-y-2">
                        <Label>Monto</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                name="amount"
                                placeholder="0.00"
                                className="pl-7"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar Pago
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
