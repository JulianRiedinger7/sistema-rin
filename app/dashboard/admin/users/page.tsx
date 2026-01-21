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
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { CreateStudentDialog } from './create-student-dialog'
import { UserSearch } from './user-search'
import { DeleteStudentButton } from './delete-student-button'

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const supabase = await createClient()
    const { q } = await searchParams

    let query = supabase
        .from('profiles')
        .select('*, payments(date, status)')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

    if (q) {
        query = query.ilike('full_name', `%${q}%`)
    }

    const { data: users, error } = await query

    if (error) {
        return <div>Error al cargar alumnos</div>
    }

    // Helper to calc status
    const getUserStatus = (user: any) => {
        const now = new Date()
        // 1. Is New? (< 30 days created)
        const created = new Date(user.created_at)
        const diffCreated = (now.getTime() - created.getTime()) / (1000 * 3600 * 24)

        // 2. Latest Payment
        const payments = user.payments || []
        const paidPayments = payments
            .filter((p: any) => p.status === 'paid')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Check Active Logic
        let isActive = false
        if (diffCreated <= 30) isActive = true
        else if (paidPayments.length > 0) {
            const lastPay = new Date(paidPayments[0].date)
            const diffPay = (now.getTime() - lastPay.getTime()) / (1000 * 3600 * 24)
            if (diffPay <= 30) isActive = true
        }

        if (isActive) return { label: 'AL DÍA', color: 'bg-green-100 text-green-700' }

        // Check Pending (has pending payment? or just overdue?)
        // If not active, and has previous payments, it's "Moroso" or "Baja".
        // Let's simplified: If not active -> Vencido
        return { label: 'VENCIDO', color: 'bg-red-100 text-red-700' }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-primary">Alumnos</h1>
                <div className="flex items-center gap-2">
                    <UserSearch />
                    <CreateStudentDialog />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Fecha de Ingreso</TableHead>
                            <TableHead>Estado Cuota</TableHead>
                            <TableHead>Estado T&C</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay alumnos registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {users?.map((user) => {
                            const status = getUserStatus(user)
                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name || 'Sin Nombre'}</TableCell>
                                    <TableCell>{user.dni || '-'}</TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`${status.color} hover:${status.color} border-0`}>
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.has_accepted_terms ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200">
                                                Ok
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                                Falta
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/dashboard/admin/users/${user.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DeleteStudentButton studentId={user.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
