'use client'

import { DeleteButton } from "@/components/ui/delete-button"
import { deleteTeam } from "@/app/dashboard/admin/teams/actions"

interface TeamDeleteActionProps {
    teamId: string
}

export function TeamDeleteAction({ teamId }: TeamDeleteActionProps) {
    return (
        <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            <DeleteButton
                onDelete={async () => {
                    await deleteTeam(teamId)
                }}
                description="Se eliminarán todos los jugadores y testeos asociados a este equipo."
            />
        </div>
    )
}
