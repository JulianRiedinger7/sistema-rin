import { getBenchmarks } from './actions'
import { AddBenchmarkDialog } from './add-benchmark-dialog'
import { ClientProgressCharts } from './client-progress-charts'

export default async function ProgressPage() {
    const logs = await getBenchmarks()
    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Mi Progreso</h1>
                    <p className="text-muted-foreground mt-1">Sigue tu evolución en los ejercicios principales.</p>
                </div>
                <AddBenchmarkDialog />
            </div>

            <ClientProgressCharts logs={logs} />
        </div>
    )
}
