'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { deleteRoutine, toggleRoutineActive } from './actions'
import { useState } from 'react'
import { ViewRoutineDialog } from './view-routine-dialog'

export function RoutineRowActions({ routine }: { routine: any }) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esta rutina?')) return
        setLoading(true)
        const result = await deleteRoutine(routine.id)
        if (result?.error) {
            alert(result.error)
        }
        setLoading(false)
    }

    const handleToggle = async () => {
        setLoading(true)
        const result = await toggleRoutineActive(routine.id, !routine.is_active)
        if (result?.error) {
            alert(result.error)
        }
        setLoading(false)
    }

    return (
        <div className="flex justify-end gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                disabled={loading}
                className={routine.is_active ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}
                title={routine.is_active ? "Desactivar" : "Activar"}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    routine.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />
                )}
            </Button>

            <ViewRoutineDialog routine={routine} />

            <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={loading}
                className="hover:text-destructive"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    )
}
