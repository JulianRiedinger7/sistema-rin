'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Users, UserPlus, UserMinus, AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

type Profile = {
    id: string
    created_at: string
    full_name: string
}

type Payment = {
    user_id: string
    date: string // YYYY-MM-DD
    status: 'paid' | 'pending' | 'overdue'
}

type DashboardStatsProps = {
    profiles: Profile[]
    payments: Payment[]
}

export function DashboardStats({ profiles, payments }: DashboardStatsProps) {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = lastMonthDate.getMonth()

    // Helper to check if date is within last 30 days
    const isWithin30Days = (dateStr: string) => {
        const date = new Date(dateStr)
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        return diffDays <= 30
    }

    // --- METRICS CALCULATION ---

    // 1. New Users (Registered this month)
    const newUsers = profiles.filter(p => {
        const d = new Date(p.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    // 2. Active Users
    // Logic: Created <= 30 days OR Last Approved Payment <= 30 days
    const activeUsers = profiles.filter(user => {
        // Is new?
        if (isWithin30Days(user.created_at)) return true

        // Has recent payment?
        const userPayments = payments
            .filter(p => p.user_id === user.id && p.status === 'paid')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        if (userPayments.length > 0) {
            return isWithin30Days(userPayments[0].date)
        }
        return false
    })

    // 3. Dropouts (Bajas)
    // Logic: Paid last month, but NOT this month
    const dropouts = profiles.filter(user => {
        const userPayments = payments.filter(p => p.user_id === user.id && p.status === 'paid')

        // Check if paid in last month (calendar month)
        const paidLastMonth = userPayments.some(p => {
            const d = new Date(p.date)
            return d.getMonth() === lastMonth
        })

        // Check if paid this month
        const paidThisMonth = userPayments.some(p => {
            const d = new Date(p.date)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })

        return paidLastMonth && !paidThisMonth
    })

    // 4. Overdue (Morosos) (Cuotas Pendientes)
    const overdueUsers = profiles.filter(user => {
        // Is new?
        if (isWithin30Days(user.created_at)) return false

        // Latest payment
        const userPayments = payments
            .filter(p => p.user_id === user.id && p.status === 'paid')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        if (userPayments.length === 0) return false // Never paid

        const lastPay = new Date(userPayments[0].date)
        const diffTime = Math.abs(now.getTime() - lastPay.getTime())
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        // If it's between 31 and 60 days
        return diffDays > 30 && diffDays <= 60
    })

    // Helper to render User List
    const UserListDialog = ({ title, users, children }: { title: string, users: Profile[], children: React.ReactNode }) => (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer transition-transform hover:scale-[1.02]">
                    {children}
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title} ({users.length})</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                    {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay alumnos en esta categoría.</p>
                    ) : (
                        <div className="space-y-4">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {u.full_name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="text-sm font-medium">{u.full_name || 'Sin Nombre'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Activos */}
            <UserListDialog title="Alumnos Activos" users={activeUsers}>
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            ALUMNOS ACTIVOS
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUsers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de matrícula actual
                        </p>
                    </CardContent>
                </Card>
            </UserListDialog>

            {/* Nuevos */}
            <UserListDialog title="Nuevos Ingresos" users={newUsers}>
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            NUEVOS (INGRESOS)
                        </CardTitle>
                        <UserPlus className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{newUsers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Registrados este mes
                        </p>
                    </CardContent>
                </Card>
            </UserListDialog>

            {/* Bajas */}
            <UserListDialog title="Abandonos (Bajas)" users={dropouts}>
                <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            ABANDONOS (BAJAS)
                        </CardTitle>
                        <UserMinus className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-{dropouts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            No renovaron cuota
                        </p>
                    </CardContent>
                </Card>
            </UserListDialog>

            {/* Morosos */}
            <UserListDialog title="Cuotas Pendientes" users={overdueUsers}>
                <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            CUOTAS PENDIENTES
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{overdueUsers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Vencidos recientemente
                        </p>
                    </CardContent>
                </Card>
            </UserListDialog>
        </div>
    )
}
