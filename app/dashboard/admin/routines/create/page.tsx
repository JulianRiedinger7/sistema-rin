import { getStudents, getExercises } from '../actions'
import RoutineBuilder from '../routine-builder'

export default async function CreateRoutinePage() {
    const exercises = await getExercises()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Crear Rutina</h1>
            <RoutineBuilder exercises={exercises} />
        </div>
    )
}
