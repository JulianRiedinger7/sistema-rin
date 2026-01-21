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
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { updateProfile } from './actions'
import { Loader2, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditProfileDialogProps {
    profile: any
    healthSheet: any
}

export function EditProfileDialog({ profile, healthSheet }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)
        const result = await updateProfile(formData)
        setLoading(false)

        if (result?.error) {
            setError(result.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    // Format date for input
    const dobValue = profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : ''

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar Perfil
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Mi Perfil</DialogTitle>
                    <DialogDescription>
                        Actualiza tus datos personales y métricas físicas.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-6">
                    {/* Personal Data */}
                    <div className="space-y-4 border-b border-border pb-4">
                        <h4 className="font-medium text-primary">Datos Personales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dni">DNI</Label>
                                <Input id="dni" name="dni" defaultValue={profile.dni || ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" name="phone" defaultValue={profile.phone || ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={dobValue} required />
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-4 border-b border-border pb-4">
                        <h4 className="font-medium text-primary">Métricas Corporales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight">Peso (kg)</Label>
                                <Input id="weight" name="weight" type="number" step="0.1" defaultValue={healthSheet?.weight || ''} placeholder="Ej: 75.5" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height">Altura (cm)</Label>
                                <Input id="height" name="height" type="number" defaultValue={healthSheet?.height || ''} placeholder="Ej: 175" />
                            </div>
                        </div>
                    </div>

                    {/* Health Sheet */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-primary">Ficha de Salud</h4>
                        <div className="space-y-2">
                            <Label htmlFor="goals">Objetivos</Label>
                            <Textarea id="goals" name="goals" defaultValue={healthSheet?.goals || ''} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="injuries">Lesiones</Label>
                                <Textarea id="injuries" name="injuries" defaultValue={healthSheet?.injuries || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="medicalConditions">Condiciones</Label>
                                <Textarea id="medicalConditions" name="medicalConditions" defaultValue={healthSheet?.medical_conditions || ''} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="allergies">Alergias</Label>
                            <Input id="allergies" name="allergies" defaultValue={healthSheet?.allergies || ''} />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
