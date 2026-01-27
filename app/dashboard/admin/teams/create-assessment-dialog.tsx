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
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useState, useTransition, useEffect } from "react"
import { createAssessment, getTeamConfig } from "./actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface CreateAssessmentDialogProps {
    playerId: string
    teamId: string
}

export function CreateAssessmentDialog({ playerId, teamId }: CreateAssessmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // CMJ Form State
    const [division, setDivision] = useState("")
    const [cmjTotal, setCmjTotal] = useState("")
    const [cmjLeft, setCmjLeft] = useState("")
    const [cmjRight, setCmjRight] = useState("")
    const [notes, setNotes] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const [diffPercent, setDiffPercent] = useState<number | null>(null)
    const [rating, setRating] = useState<'bueno' | 'regular' | 'malo'>('bueno')
    const [thresholds, setThresholds] = useState({ regular: 10, bad: 15 })

    // Fetch config on open
    useEffect(() => {
        if (open && teamId) {
            getTeamConfig(teamId).then(config => {
                if (config) setThresholds(config)
            })
        }
    }, [open, teamId])

    // Calculate Asymmetry
    useEffect(() => {
        const left = parseFloat(cmjLeft)
        const right = parseFloat(cmjRight)

        if (!isNaN(left) && !isNaN(right) && left > 0 && right > 0) {
            // Formula: |L - R| / Max(L, R) * 100 ?? 
            // User image example: Izq 30.7, Der 11.2 -> Diff ~18%? That math doesn't check out with standard formulas.
            // Let's stick to standard Asymmetry Index: |L - R| / Max(L, R) * 100
            const max = Math.max(left, right)
            const diff = Math.abs(left - right)
            const percent = (diff / max) * 100

            setDiffPercent(parseFloat(percent.toFixed(2)))

            if (percent < thresholds.regular) {
                setRating('bueno')
            } else if (percent < thresholds.bad) {
                setRating('regular')
            } else {
                setRating('malo')
            }
        } else {
            setDiffPercent(null)
        }
    }, [cmjLeft, cmjRight, thresholds])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            try {
                await createAssessment(playerId, teamId, {
                    exercise: 'CMJ', // Hardcoded as this is the new standard
                    value: parseFloat(cmjTotal) || 0, // Main value is the bilateral CMJ
                    date,
                    metrics: {
                        division,
                        cmj: parseFloat(cmjTotal),
                        cmj_left: parseFloat(cmjLeft),
                        cmj_right: parseFloat(cmjRight),
                        diff_percent: diffPercent,
                        rating
                    },
                    notes
                })
                setOpen(false)
                // Reset form
                setCmjTotal("")
                setCmjLeft("")
                setCmjRight("")
                setDivision("")
                setNotes("")

                toast.success("Testeo guardado", {
                    description: "El testeo CMJ ha sido registrado.",
                })
            } catch (error) {
                toast.error("Error", {
                    description: "Hubo un error al guardar el testeo.",
                })
            }
        })
    }

    const getRatingColor = () => {
        switch (rating) {
            case 'bueno': return "bg-green-500 hover:bg-green-600"
            case 'regular': return "bg-yellow-500 hover:bg-yellow-600"
            case 'malo': return "bg-red-500 hover:bg-red-600"
            default: return "bg-gray-500"
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Testeo (CMJ)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Registrar Testeo de Saltabilidad (CMJ)</DialogTitle>
                    <DialogDescription>
                        Ingresa los valores del salto Counter Movement Jump.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Fecha</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="division">División</Label>
                                <Input
                                    id="division"
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                    placeholder="Ej: Primera"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
                            <div className="grid gap-2">
                                <Label htmlFor="cmjTotal">CMJ (Bipodal)</Label>
                                <div className="relative">
                                    <Input
                                        id="cmjTotal"
                                        type="number"
                                        value={cmjTotal}
                                        onChange={(e) => setCmjTotal(e.target.value)}
                                        step="0.1"
                                        placeholder="0.0"
                                        required
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">cm</span>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cmjLeft">CMJ Izquierda</Label>
                                <div className="relative">
                                    <Input
                                        id="cmjLeft"
                                        type="number"
                                        value={cmjLeft}
                                        onChange={(e) => setCmjLeft(e.target.value)}
                                        step="0.1"
                                        placeholder="0.0"
                                        required
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">cm</span>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cmjRight">CMJ Derecha</Label>
                                <div className="relative">
                                    <Input
                                        id="cmjRight"
                                        type="number"
                                        value={cmjRight}
                                        onChange={(e) => setCmjRight(e.target.value)}
                                        step="0.1"
                                        placeholder="0.0"
                                        required
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">cm</span>
                                </div>
                            </div>
                        </div>

                        {diffPercent !== null && (
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-muted-foreground">Dif % Izq - Der</span>
                                    <span className="text-2xl font-bold">{diffPercent}%</span>
                                </div>
                                <Badge className={`${getRatingColor()} text-white text-lg px-4 py-1 capitalize`}>
                                    {rating}
                                </Badge>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Observaciones</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notas adicionales..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Testeo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
