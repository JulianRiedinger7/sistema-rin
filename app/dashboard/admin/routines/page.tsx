import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { RoutineRowActions } from './row-actions'

export default async function RoutinesPage() {
    const supabase = await createClient()

    // Fetch routines and deep fetch items for the details dialog
    const { data: routines, error } = await supabase
        .from('workouts')
        .select(`
            *,
            items:workout_items(
                id, sets, reps, target_rpe, notes,
                exercise:exercises(name, category, video_url)
            ),
            completions:workout_completions(count)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error al cargar rutinas</div>
    }

    const getActivityLabel = (type: string) => {
        switch (type) {
            case 'gym': return 'Gimnasio'
            case 'pilates': return 'Pilates'
            case 'mixed': return 'Mixto'
            default: return type
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Gestión de Rutinas</h1>
                <Button asChild>
                    <Link href="/dashboard/admin/routines/create">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Rutina
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Actividad Asignada</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {routines?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No hay rutinas creadas.
                                </TableCell>
                            </TableRow>
                        )}
                        {routines?.map((routine) => (
                            <TableRow key={routine.id}>
                                <TableCell className="font-medium">
                                    {routine.name}
                                    <div className="text-xs text-muted-foreground line-clamp-1">{routine.notes}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                        {getActivityLabel(routine.activity_type)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(routine.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <RoutineRowActions routine={routine} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
