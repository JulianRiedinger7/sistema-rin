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
import { Settings } from "lucide-react"
import { useState, useTransition, useEffect } from "react"
import { getTeamConfig, updateTeamConfig } from "@/app/dashboard/admin/teams/actions"
import { toast } from "sonner"

interface AssessmentConfigDialogProps {
    teamId: string
}

export function AssessmentConfigDialog({ teamId }: AssessmentConfigDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [regularThreshold, setRegularThreshold] = useState("10")
    const [badThreshold, setBadThreshold] = useState("15")

    useEffect(() => {
        if (open && teamId) {
            startTransition(async () => {
                const config = await getTeamConfig(teamId)
                if (config) {
                    setRegularThreshold(config.regular.toString())
                    setBadThreshold(config.bad.toString())
                }
            })
        }
    }, [open, teamId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            try {
                await updateTeamConfig(teamId, {
                    regular: parseFloat(regularThreshold),
                    bad: parseFloat(badThreshold)
                })
                setOpen(false)
                toast.success("Configuración actualizada", {
                    description: "Los umbrales de asimetría del equipo han sido actualizados.",
                })
            } catch (error) {
                toast.error("Error", {
                    description: "Hubo un error al actualizar la configuración.",
                })
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configuración de CMJ (Equipo)</DialogTitle>
                    <DialogDescription>
                        Define los umbrales de asimetría específicos para este equipo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="regular" className="text-right">
                                Regular (%)
                            </Label>
                            <Input
                                id="regular"
                                type="number"
                                value={regularThreshold}
                                onChange={(e) => setRegularThreshold(e.target.value)}
                                className="col-span-3"
                                placeholder="10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bad" className="text-right">
                                Malo (%)
                            </Label>
                            <Input
                                id="bad"
                                type="number"
                                value={badThreshold}
                                onChange={(e) => setBadThreshold(e.target.value)}
                                className="col-span-3"
                                placeholder="15"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
