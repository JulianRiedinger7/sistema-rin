'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Algo salió mal</h2>
            <p className="max-w-[500px] text-muted-foreground">
                Ocurrió un error inesperado al cargar el panel. Por favor intenta recargar la página.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.reload()} variant="outline">
                    Recargar Página
                </Button>
                <Button onClick={() => reset()}>
                    Reintentar Componente
                </Button>
            </div>
            {error.digest && (
                <p className="mt-4 text-xs text-muted-foreground font-mono">
                    Código de error: {error.digest}
                </p>
            )}
        </div>
    )
}
