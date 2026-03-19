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
import { Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { CreateStudentDialog } from './create-student-dialog'
import { UserSearch } from './user-search'
import { DeleteStudentButton } from './delete-student-button'
import { calculateQuotaInfo } from '@/lib/quota-utils'

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-primary">Alumnos</h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <UserSearch />
                    <CreateStudentDialog />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Días Restantes</TableHead>
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
                            const quota = calculateQuotaInfo(
                                user.created_at,
                                user.payments || []
                            )

                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name || 'Sin Nombre'}</TableCell>
                                    <TableCell>
                                        {quota.isExpired ? (
                                            <div className="flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-red-500 font-semibold text-sm">Vencida</span>
                                            </div>
                                        ) : quota.isAboutToExpire ? (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-4 w-4 text-yellow-500" />
                                                <span className="text-yellow-500 font-semibold text-sm">{quota.daysRemaining}d</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-green-500 font-semibold text-sm">{quota.daysRemaining}d</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`${quota.statusColor} hover:${quota.statusColor} border-0`}>
                                            {quota.statusLabel}
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
