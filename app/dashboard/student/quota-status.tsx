'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { calculateQuotaInfo } from '@/lib/quota-utils'

type Payment = {
    date: string
    status: 'paid' | 'pending' | 'overdue'
}

export function QuotaStatus({ createdAt, payments }: { createdAt: string, payments: Payment[] }) {
    const quota = calculateQuotaInfo(createdAt, payments)

    let Icon = CheckCircle
    if (quota.isExpired) Icon = AlertCircle
    else if (quota.isAboutToExpire) Icon = Clock

    return (
        <Card className="border-bg-card bg-muted/40 w-full md:w-auto min-w-[300px]">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Estado de Cuota</p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${quota.statusColor} flex items-center gap-1`}>
                            <Icon className="h-3 w-3" />
                            {quota.statusLabel}
                        </Badge>
                        {!quota.isExpired && (
                            <span className="text-xs text-muted-foreground">
                                {quota.daysRemaining} días restantes
                            </span>
                        )}
                    </div>
                </div>
                {!quota.isExpired && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Vence el</p>
                        <p className="font-semibold text-sm">{quota.expirationDate.toLocaleDateString()}</p>
                    </div>
                )}
                {quota.isExpired && (
                    <div className="text-right">
                        <p className="text-xs text-red-400 font-medium">Requiere Pago</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
