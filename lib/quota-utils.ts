import { differenceInCalendarDays, addDays } from "date-fns"

type Payment = {
    date: string
    status: string
}

export interface QuotaInfo {
    daysRemaining: number
    isExpired: boolean
    isAboutToExpire: boolean
    hasPendingPayment: boolean
    expirationDate: Date
    statusLabel: string
    statusColor: string
}

/**
 * Calculate quota/membership status based on account creation date and payment history.
 * Logic: Expiration = Max(CreatedAt, LastPaidDate) + 30 days
 */
export function calculateQuotaInfo(createdAt: string, payments: Payment[]): QuotaInfo {
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

    const expirationDate = addDays(baseDate, 30)
    const daysRemaining = differenceInCalendarDays(expirationDate, now)
    const isExpired = daysRemaining < 0
    const isAboutToExpire = !isExpired && daysRemaining <= 7
    const hasPendingPayment = payments.some(p => p.status === 'pending')

    // Determine status
    let statusLabel = 'Al Día'
    let statusColor = 'bg-green-500/10 text-green-500 border-green-500/20'

    if (isExpired) {
        statusLabel = hasPendingPayment ? 'Pago Pendiente' : 'Vencida'
        statusColor = hasPendingPayment
            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20'
    } else if (isAboutToExpire) {
        statusLabel = 'Por Vencer'
        statusColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }

    return {
        daysRemaining,
        isExpired,
        isAboutToExpire,
        hasPendingPayment,
        expirationDate,
        statusLabel,
        statusColor,
    }
}
