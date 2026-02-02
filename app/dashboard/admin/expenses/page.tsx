import { createClient } from '@/utils/supabase/server'
import { ExpensesDashboard } from './expenses-dashboard'
import { ExpenseDialog } from './expense-dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ExpensesPage() {
    const supabase = await createClient()

    // Fetch Expenses
    const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

    // Fetch Payments (Income)
    const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, date, activity, status')
        .eq('status', 'paid') // Only paid counts as income
        .order('date', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/admin/payments">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">Análisis de Gastos</h1>
                </div>
                <ExpenseDialog />
            </div>

            <ExpensesDashboard
                initialExpenses={expenses || []}
                initialPayments={(payments || []) as any[]}
            />
        </div>
    )
}
