'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

interface DeleteButtonProps {
    onDelete: () => Promise<void>
    title?: string
    description?: string
    icon?: boolean
}

export function DeleteButton({
    onDelete,
    title = "¿Estás seguro?",
    description = "Esta acción no se puede deshacer.",
    icon = true
}: DeleteButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await onDelete()
                toast.success("Eliminado correctamente")
            } catch (error) {
                toast.error("Error al eliminar", {
                    description: "Por favor intenta nuevamente."
                })
            }
        })
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size={icon ? "icon" : "default"} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    {icon ? <Trash2 className="h-4 w-4" /> : "Eliminar"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isPending}
                    >
                        {isPending ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
