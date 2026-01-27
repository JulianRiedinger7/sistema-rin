'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

type Payment = {
    date: string
    status: 'paid' | 'pending' | 'overdue'
}

import { differenceInCalendarDays, addDays } from "date-fns"

export function QuotaStatus({ createdAt, payments }: { createdAt: string, payments: Payment[] }) {
    // Logic: Expiration = Max(CreatedAt, LastPaidDate) + 30 days
    const now = new Date()
    const createdDate = new Date(createdAt)

    // Find latest paid date
    const paidPayments = payments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let baseDate = createdDate
    if (paidPayments.length > 0) {
        const lastPay = new Date(paidPayments[0].date)
        if (lastPay > baseDate) {
            baseDate = lastPay
        }
    }

    // Use addDays to be safe with month boundaries and easier to read
    const expirationDate = addDays(baseDate, 30)

    // Calculate difference in calendar days (ignores specific time, purely date based)
    const daysRemaining = differenceInCalendarDays(expirationDate, now)

    const isExpired = daysRemaining < 0
    const hasPending = payments.some(p => p.status === 'pending')

    // Determine status label/color
    let statusLabel = 'Al Día'
    let statusColor = 'bg-green-500/10 text-green-500 border-green-500/20'
    let Icon = CheckCircle

    if (isExpired) {
        statusLabel = 'Vencida'
        statusColor = 'bg-red-500/10 text-red-500 border-red-500/20'
        Icon = AlertCircle
    } else if (daysRemaining <= 7) {
        statusLabel = 'Por Vencer'
        statusColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        Icon = Clock
    }

    if (hasPending && isExpired) {
        statusLabel = 'Pago Pendiente'
        statusColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        Icon = Clock
    }

    return (
        <Card className="border-bg-card bg-muted/40 w-full md:w-auto min-w-[300px]">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Estado de Cuota</p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${statusColor} flex items-center gap-1`}>
                            <Icon className="h-3 w-3" />
                            {statusLabel}
                        </Badge>
                        {!isExpired && (
                            <span className="text-xs text-muted-foreground">
                                {daysRemaining} días restantes
                            </span>
                        )}
                    </div>
                </div>
                {!isExpired && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Vence el</p>
                        <p className="font-semibold text-sm">{expirationDate.toLocaleDateString()}</p>
                    </div>
                )}
                {isExpired && (
                    <div className="text-right">
                        <p className="text-xs text-red-400 font-medium">Requiere Pago</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
