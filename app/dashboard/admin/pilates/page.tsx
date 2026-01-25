'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPilatesConfig, getBookingsForWeek, updatePilatesConfig } from '@/app/dashboard/pilates/actions'
import { PilatesConfig, Booking } from '@/app/dashboard/pilates/types'
import { PilatesScheduler } from '@/components/pilates/scheduler-grid'
import { Loader2, Settings, Users } from 'lucide-react'
import { toast } from 'sonner'
import { startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'

export default function AdminPilatesPage() {
    const [config, setConfig] = useState<PilatesConfig | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showConfig, setShowConfig] = useState(true)

    const [formConfig, setFormConfig] = useState({
        morning_start: 7,
        morning_end: 12,
        afternoon_start: 16,
        afternoon_end: 21
    })

    const fetchData = async () => {
        setLoading(true)
        const [configData, bookingsData] = await Promise.all([
            getPilatesConfig(),
            getBookingsForWeek(startOfWeek(new Date(), { weekStartsOn: 1 }), endOfWeek(new Date(), { weekStartsOn: 1 }))
        ])

        if (configData) {
            setConfig(configData)
            setFormConfig(configData)
        }
        if (bookingsData) setBookings(bookingsData)

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSaveConfig = async () => {
        setSaving(true)
        const res = await updatePilatesConfig(formConfig)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Configuración actualizada')
            setConfig(formConfig)
            fetchData() // Refresh to redraw grid
        }
        setSaving(false)
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        Cronograma Pilates
                    </h1>
                    <p className="text-muted-foreground">Administra horarios y reservas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
                        <Settings className="w-4 h-4 mr-2" />
                        {showConfig ? 'Ocultar Config' : 'Configurar Horarios'}
                    </Button>
                </div>
            </div>

            {showConfig && (
                <Card className="bg-muted/30 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <Settings className="w-4 h-4" /> Configuración de Bandas Horarias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div className="space-y-2 p-3 bg-background rounded-md border">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Turno Mañana</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={formConfig.morning_start}
                                            onChange={e => setFormConfig({ ...formConfig, morning_start: parseInt(e.target.value) })}
                                            className="w-20"
                                        />
                                        <span>a</span>
                                        <Input
                                            type="number"
                                            value={formConfig.morning_end}
                                            onChange={e => setFormConfig({ ...formConfig, morning_end: parseInt(e.target.value) })}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">hs</span>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3 bg-background rounded-md border">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Turno Tarde</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={formConfig.afternoon_start}
                                            onChange={e => setFormConfig({ ...formConfig, afternoon_start: parseInt(e.target.value) })}
                                            className="w-20"
                                        />
                                        <span>a</span>
                                        <Input
                                            type="number"
                                            value={formConfig.afternoon_end}
                                            onChange={e => setFormConfig({ ...formConfig, afternoon_end: parseInt(e.target.value) })}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">hs</span>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleSaveConfig} disabled={saving} className="bg-primary hover:bg-primary/90">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar Cambios'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {config && (
                <PilatesScheduler
                    config={config}
                    initialBookings={bookings}
                    userId="admin" // Admin doesn't book for self usually in this view
                    isAdmin={true}
                    onBookingChange={fetchData} // Refresh on changes
                />
            )}
        </div>
    )
}
