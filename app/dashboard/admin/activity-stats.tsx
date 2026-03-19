'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ACTIVITY_TYPES, getActivityLabel, getActivityShortLabel } from '@/lib/activity-types'
import { Activity, Users } from 'lucide-react'

type Profile = {
    id: string
    full_name: string
    activity_type?: string
    pilates_weekly_classes?: number | null
}

interface ActivityStatsProps {
    profiles: Profile[]
}

const UserListDialog = ({ title, users }: { title: string, users: Profile[] }) => (
    <Dialog>
        <DialogTrigger asChild>
            <div className="cursor-pointer transition-transform hover:scale-[1.02] h-full">
                <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between">
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground line-clamp-1" title={title}>
                            {title}
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
            </div>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title} ({users.length})</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay alumnos en esta actividad.</p>
                ) : (
                    <div className="space-y-4">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {u.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{u.full_name || 'Sin Nombre'}</div>
                                    {u.pilates_weekly_classes && (
                                        <div className="text-xs text-muted-foreground">{u.pilates_weekly_classes}x/semana</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </DialogContent>
    </Dialog>
)

export function ActivityStats({ profiles }: ActivityStatsProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary/90 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Alumnos por Actividad
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {ACTIVITY_TYPES.map((activity) => {
                    const usersInActivity = profiles.filter(p => p.activity_type === activity.value)

                    return (
                        <UserListDialog
                            key={activity.value}
                            title={activity.label}
                            users={usersInActivity}
                        />
                    )
                })}
            </div>
        </div>
    )
}
