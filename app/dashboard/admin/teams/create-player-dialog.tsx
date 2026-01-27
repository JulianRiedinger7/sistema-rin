'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState, useTransition } from "react"
import { createPlayer } from "./actions"
import { toast } from "sonner"

interface CreatePlayerDialogProps {
    teamId: string
}

export function CreatePlayerDialog({ teamId }: CreatePlayerDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()


    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [height, setHeight] = useState("")
    const [weight, setWeight] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            try {
                await createPlayer(teamId, {
                    first_name: firstName,
                    last_name: lastName,
                    height: height ? parseFloat(height) : undefined,
                    weight: weight ? parseFloat(weight) : undefined
                })
                setOpen(false)
                setFirstName("")
                setLastName("")
                setHeight("")
                setWeight("")
                toast.success("Jugador agregado", {
                    description: "El jugador ha sido agregado al equipo.",
                })
            } catch (error) {
                toast.error("Error", {
                    description: "Hubo un error al agregar el jugador.",
                })
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Jugador
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Jugador</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos del nuevo jugador.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">Nombre</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">Apellido</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="height" className="text-right">Altura (cm)</Label>
                            <Input
                                id="height"
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="col-span-3"
                                placeholder="180"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="weight" className="text-right">Peso (kg)</Label>
                            <Input
                                id="weight"
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="col-span-3"
                                placeholder="75.5"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
