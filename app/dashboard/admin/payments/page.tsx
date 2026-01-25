import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, ExternalLink, Search } from 'lucide-react'
import { PriceConfigDialog } from './price-config-dialog'
import { RegisterPaymentDialog } from './payment-dialog'
import { Input } from '@/components/ui/input' // Note: Should move search to client component
import PaymentSearch from './payment-search'

export default async function PaymentsAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>
}) {
    const query = (await searchParams).query
    const supabase = await createClient()

    // Query construction
    let paymentQuery = supabase
        .from('payments')
        .select('*, profiles!inner(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (query) {
        paymentQuery = paymentQuery.ilike('profiles.full_name', `%${query}%`)
    }

    const { data: payments } = await paymentQuery

    // Fetch students for the dialog
    const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'student')

    // Fetch prices
    const { data: prices } = await supabase
        .from('activity_prices')
        .select('*')

    const getActivityLabel = (type: string) => {
        switch (type) {
            case 'gym': return 'Gimnasio'
            case 'pilates': return 'Pilates'
            case 'mixed': return 'Mixto'
            default: return type || '-'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-primary">Control de Pagos</h1>

                <div className="flex flex-wrap items-center gap-2">
                    <PaymentSearch />
                    <PriceConfigDialog prices={prices || []} />
                    <RegisterPaymentDialog students={students || []} pricedActivities={prices || []} />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Alumno</TableHead>
                            <TableHead>Actividad</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay pagos registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {payments?.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{(() => {
                                    const d = new Date(payment.date);
                                    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
                                })()}</TableCell>
                                {/* @ts-ignore */}
                                <TableCell>{payment.profiles?.full_name}</TableCell>
                                <TableCell className="capitalize">{getActivityLabel(payment.activity)}</TableCell>
                                <TableCell>${payment.amount}</TableCell>
                                <TableCell className="capitalize">{payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}</TableCell>
                                <TableCell>
                                    {payment.status === 'paid' && <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>}
                                    {payment.status === 'pending' && <Badge className="bg-orange-500 hover:bg-orange-600">Pendiente</Badge>}
                                    {payment.status === 'overdue' && <Badge variant="destructive">Vencido</Badge>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
