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
import { Edit, Trash2 } from 'lucide-react'
import { ExerciseDialog } from './exercise-dialog'
import { deleteExercise } from './actions' // We'll need a client component for delete to handle onClick properly or wrap it in a form.

// To handle Delete easier in RSC, we can use a tiny client component or just a form with action.
// Let's make a small DeleteButton client component for better UX (confirm?)
// For now, simple form action button.

export default async function ExercisesPage() {
    const supabase = await createClient()

    // Fetch all exercises
    const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error al cargar ejercicios</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Biblioteca de Ejercicios</h1>
                <ExerciseDialog />
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Músculo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exercises?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No hay ejercicios registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {exercises?.map((exercise) => (
                            <TableRow key={exercise.id}>
                                <TableCell className="font-medium">{exercise.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{exercise.category}</Badge>
                                </TableCell>
                                <TableCell>{exercise.muscle_group || '-'}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <ExerciseDialog mode="edit" exercise={exercise}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </ExerciseDialog>

                                    <form action={async () => {
                                        'use server'
                                        await deleteExercise(exercise.id)
                                    }}>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
