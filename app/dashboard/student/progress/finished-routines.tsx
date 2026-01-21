'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Calendar, Clock } from 'lucide-react'
import CompletedRoutineViewer from './completed-routine-viewer'

export function FinishedRoutinesList({ completions }: { completions: any[] }) {
    if (!completions || completions.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Rutinas Finalizadas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {completions.map((completion) => (
                        <CompletedRoutineViewer key={completion.id} completion={completion}>
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors group">
                                <div>
                                    <h4 className="font-semibold group-hover:text-primary transition-colors">{completion.workout?.name || 'Rutina Desconocida'}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                            {completion.workout?.activity_type || 'Personal'}
                                        </Badge>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(completion.completed_at).toLocaleDateString()}
                                        </span>
                                        {completion.day_number && (
                                            <span className="flex items-center gap-1 bg-primary/10 px-1 rounded">
                                                Día {completion.day_number}
                                            </span>
                                        )}
                                        {completion.duration_seconds && (
                                            <span className="flex items-center gap-1 text-primary">
                                                <Clock className="h-3 w-3" />
                                                {Math.floor(completion.duration_seconds / 60)} min
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    Ver detalles &rarr;
                                </div>
                            </div>
                        </CompletedRoutineViewer>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
