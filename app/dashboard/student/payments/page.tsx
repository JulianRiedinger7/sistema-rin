'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { uploadPaymentProof } from './actions'
import { Loader2, Plus, History } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useEffect } from 'react'

export default function StudentPaymentsPage() {
    const [loading, setLoading] = useState(false)
    const [payments, setPayments] = useState<any[]>([])

    // Client-side fetch for simplicity in this component or could use server component + client wrapper
    // Let's stick to client fetch for the list to easy refresh
    const supabase = createClient()

    useEffect(() => {
        const fetchPayments = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                setPayments(data || [])
            }
        }
        fetchPayments()
    }, [])

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        await uploadPaymentProof(formData)
        setLoading(false)
        // Refresh list
        window.location.reload() // brute force refresh for MVP
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-primary">Mis Pagos</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Reportar Transferencia</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Monto Transferido</Label>
                            <Input type="number" name="amount" placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Link del Comprobante</Label>
                            <Input type="url" name="proofUrl" placeholder="https://..." />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Sube tu imagen a un servicio externo (Imgur, Drive) y pega el link aqui.
                            </p>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Comprobante
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" /> Historial
                </h3>
                {payments.length === 0 && <p className="text-muted-foreground">No hay pagos registrados.</p>}

                <div className="grid gap-3">
                    {payments.map((p) => (
                        <Card key={p.id} className="bg-card/50">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold">${p.amount}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs capitalize text-muted-foreground">{p.method}</span>
                                    {p.status === 'paid' && <Badge className="bg-green-500">Pagado</Badge>}
                                    {p.status === 'pending' && <Badge className="bg-orange-500">Pendiente</Badge>}
                                    {p.status === 'overdue' && <Badge variant="destructive">Vencido</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
