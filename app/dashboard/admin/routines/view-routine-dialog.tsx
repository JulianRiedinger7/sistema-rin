'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, ExternalLink, PlayCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RoutineDetails {
    id: string
    name: string
    notes?: string
    activity_type: string
    items: {
        id: string
        sets: number
        reps: number
        target_rpe?: number
        notes?: string
        exercise: {
            name: string
            video_url?: string
            category: string
        }
    }[]
    // @ts-ignore
    completions?: { count: number }[]
}

export function ViewRoutineDialog({ routine }: { routine: RoutineDetails }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Detalle</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl">{routine.name}</DialogTitle>
                        <Badge variant="outline" className="capitalize">{routine.activity_type}</Badge>
                    </div>
                    {routine.notes && (
                        <DialogDescription className="mt-2 text-sm text-muted-foreground">
                            {routine.notes}
                        </DialogDescription>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Completado por {routine.completions?.[0]?.count || 0} alumno(s)
                    </div>
                </DialogHeader>

                <div className="flex-1 pr-4 mt-4 overflow-y-auto">
                    <div className="space-y-4">
                        {routine.items.map((item, idx) => (
                            <div key={item.id} className="p-4 rounded-lg border border-border bg-card">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            <span className="text-muted-foreground text-sm font-normal">#{idx + 1}</span>
                                            {item.exercise.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs">{item.exercise.category}</Badge>
                                            {item.exercise.video_url && (
                                                <a
                                                    href={item.exercise.video_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                                >
                                                    <PlayCircle className="h-3 w-3" /> Ver Video
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right text-sm space-y-1">
                                        <div className="font-mono bg-muted px-2 py-1 rounded">
                                            {item.sets} x {item.reps}
                                        </div>
                                        {item.target_rpe && (
                                            <div className="text-muted-foreground text-xs">RPE: {item.target_rpe}</div>
                                        )}
                                    </div>
                                </div>
                                {item.notes && (
                                    <div className="mt-3 text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                                        " {item.notes} "
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
