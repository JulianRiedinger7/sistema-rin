'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPilatesWeekConfig, getBookingsForWeek, updatePilatesWeekConfig, getSlotTeachers } from '@/app/dashboard/pilates/actions'
import { PilatesConfig, Booking } from '@/app/dashboard/pilates/types'
import { SlotTeacher } from '@/app/dashboard/pilates/actions'
import { PilatesScheduler } from '@/components/pilates/scheduler-grid'
import { Loader2, Settings, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { endOfWeek, startOfMonth, addMonths, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getWeeksInMonth } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export default function AdminPilatesPage() {
    const [config, setConfig] = useState<PilatesConfig | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [teachers, setTeachers] = useState<SlotTeacher[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showConfig, setShowConfig] = useState(true)

    const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()))
    const [selectedWeekIdx, setSelectedWeekIdx] = useState(0)

    const weeks = getWeeksInMonth(selectedMonth)
    const activeWeek = weeks[selectedWeekIdx] || weeks[0]

    const [formConfig, setFormConfig] = useState({
        morning_start: 7,
        morning_end: 12,
        afternoon_start: 16,
        afternoon_end: 21
    })

    const fetchData = async () => {
        if (!activeWeek) return

        setLoading(true)
        const weekEnd = endOfWeek(activeWeek.start, { weekStartsOn: 1 })
        const [configData, bookingsData, teachersData] = await Promise.all([
            getPilatesWeekConfig(activeWeek.start),
            getBookingsForWeek(activeWeek.start, weekEnd),
            getSlotTeachers(activeWeek.start, weekEnd)
        ])

        if (configData) {
            setConfig(configData)
            setFormConfig(configData)
        }
        if (bookingsData) setBookings(bookingsData)
        setTeachers(teachersData)

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [selectedMonth, selectedWeekIdx])

    const handleSaveConfig = async () => {
        if (!activeWeek) return
        setSaving(true)
        const res = await updatePilatesWeekConfig(activeWeek.start, formConfig)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Configuración de la semana actualizada')
            setConfig(formConfig)
            fetchData()
        }
        setSaving(false)
    }

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

            {/* Selector de Mes */}
            <div className="flex items-center justify-between bg-card border rounded-lg p-2 max-w-sm">
                <Button variant="ghost" size="icon" onClick={() => { setSelectedMonth(subMonths(selectedMonth, 1)); setSelectedWeekIdx(0); }}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold capitalize">
                    {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedMonth(addMonths(selectedMonth, 1)); setSelectedWeekIdx(0); }}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Selector de Semanas estilo Tab */}
            {weeks.length > 0 && (
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-xl w-fit">
                        {weeks.map((week, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedWeekIdx(idx)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    idx === selectedWeekIdx
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                {week.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground px-1 capitalize">
                        {activeWeek?.dateRange}
                    </p>
                </div>
            )}

            {showConfig && activeWeek && (
                <Card className="bg-muted/30 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <Settings className="w-4 h-4" /> Configuración de la {activeWeek.label}
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

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : config && activeWeek ? (
                <PilatesScheduler
                    config={config}
                    initialBookings={bookings}
                    userId="admin"
                    isAdmin={true}
                    onBookingChange={fetchData}
                    activeDays={activeWeek.days}
                    slotTeachers={teachers}
                />
            ) : null}
        </div>
    )
}
