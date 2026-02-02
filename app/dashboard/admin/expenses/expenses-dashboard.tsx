'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { subDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteExpense } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Expense {
    id: string
    description: string
    amount: number
    date: string
    activity: string
}

interface Payment {
    id: string
    amount: number
    date: string
    activity: string
    status: string
}

interface DashboardProps {
    initialExpenses: Expense[]
    initialPayments: Payment[]
}

export function ExpensesDashboard({ initialExpenses, initialPayments }: DashboardProps) {
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [selectedActivity, setSelectedActivity] = useState<string>('all')

    // Filter data logic
    const filteredExpenses = initialExpenses.filter(expense => {
        const date = new Date(expense.date)
        const inDateRange = (!dateRange?.from || date >= dateRange.from) &&
            (!dateRange?.to || date <= dateRange.to)
        const inActivity = selectedActivity === 'all' || expense.activity === selectedActivity
        return inDateRange && inActivity
    })

    const filteredPayments = initialPayments.filter(payment => {
        const date = new Date(payment.date)
        const inDateRange = (!dateRange?.from || date >= dateRange.from) &&
            (!dateRange?.to || date <= dateRange.to)
        // Payments might have null activity or different strings, need to normalize if needed
        // Assuming payment.activity matches the select values
        const inActivity = selectedActivity === 'all' || payment.activity === selectedActivity
        return inDateRange && inActivity && payment.status === 'paid'
    })

    // Calculate Totals
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0)
    const totalIncome = filteredPayments.reduce((sum, item) => sum + Number(item.amount), 0)
    const netBalance = totalIncome - totalExpenses

    // Prepare Chart Data
    // We will group by date (or month if range is large, but let's stick to daily/grouped for now)
    // For simplicity efficiently, let's group by day if range < 60 days, else by month
    const getGroupKey = (dateStr: string) => {
        const d = new Date(dateStr)
        // Simple grouping by date for now
        return format(d, 'yyyy-MM-dd')
    }

    const chartDataMap = new Map<string, { date: string, income: number, expense: number }>()

    filteredPayments.forEach(p => {
        const key = getGroupKey(p.date)
        const existing = chartDataMap.get(key) || { date: key, income: 0, expense: 0 }
        existing.income += Number(p.amount)
        chartDataMap.set(key, existing)
    })

    filteredExpenses.forEach(e => {
        const key = getGroupKey(e.date)
        const existing = chartDataMap.get(key) || { date: key, income: 0, expense: 0 }
        existing.expense += Number(e.amount)
        chartDataMap.set(key, existing)
    })

    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este gasto?')) {
            const res = await deleteExpense(id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Gasto eliminado')
                router.refresh()
            }
        }
    }

    const getActivityLabel = (type: string) => {
        switch (type) {
            case 'gym': return 'Gimnasio'
            case 'pilates': return 'Pilates'
            case 'mixed': return 'Mixto'
            case 'general': return 'General'
            default: return type
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                />
                <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Actividad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="gym">Gimnasio</SelectItem>
                        <SelectItem value="pilates">Pilates</SelectItem>
                        <SelectItem value="mixed">Mixto</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                            ${netBalance.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Flujo de Caja</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: es })}
                                formatter={(value) => [`$${value}`, '']}
                            />
                            <Legend />
                            <Bar dataKey="income" name="Ingresos" fill="#22c55e" />
                            <Bar dataKey="expense" name="Gastos" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Actividad</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay gastos en este periodo.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell><Badge variant="outline">{getActivityLabel(expense.activity)}</Badge></TableCell>
                                    <TableCell>${expense.amount}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
