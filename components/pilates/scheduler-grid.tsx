'use client'

import { useState, useEffect, Fragment } from 'react'
import { startOfWeek, addDays, format, isSameDay, differenceInMinutes, isSaturday, isSunday, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Check, Circle, User, Users, Lock, X, Trash2, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bookSlot, cancelBooking, searchUsers } from '@/app/dashboard/pilates/actions'
import { Booking } from '@/app/dashboard/pilates/types'
import { adminBookSlot, adminCancelBooking } from '@/app/dashboard/pilates/admin-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebounce } from 'use-debounce'

const MAX_CAPACITY = 5

interface SchedulerProps {
    config: {
        morning_start: number
        morning_end: number
        afternoon_start: number
        afternoon_end: number
    }
    initialBookings: Booking[]
    userId: string
    isAdmin?: boolean
    onBookingChange?: () => void
}

export function PilatesScheduler({ config, initialBookings, userId, isAdmin, onBookingChange }: SchedulerProps) {
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date()
        if (isSaturday(now) || isSunday(now)) {
            return addDays(now, isSaturday(now) ? 2 : 1) // Jump to next Monday roughly, or just let startOfWeek handle it?
            // Actually, simply adding 1 week is safer if we just want "Next Week's" scope.
            // But startOfWeek is used later. 
            // If today is Sat, startOfWeek is last Mon.
            // If we want Next Mon, we need a date in next week.
            return addWeeks(now, 1)
        }
        return now
    })
    const [loading, setLoading] = useState<string | null>(null) // 'date-hour'
    const router = useRouter()

    // Admin State
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date, hour: number, bookings: Booking[] } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery] = useDebounce(searchQuery, 500)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Calculate dynamic hours based on config
    const morningHours = Array.from({ length: config.morning_end - config.morning_start + 1 }, (_, i) => config.morning_start + i)
    const afternoonHours = Array.from({ length: config.afternoon_end - config.afternoon_start + 1 }, (_, i) => config.afternoon_start + i)
    const allHours = [...morningHours, ...afternoonHours].sort((a, b) => a - b)

    // Generate week days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)) // Mon-Fri

    // Search Effect
    useEffect(() => {
        async function fetchUsers() {
            if (debouncedQuery.length < 2) {
                setSearchResults([])
                return
            }
            setIsSearching(true)
            const res = await searchUsers(debouncedQuery)
            setSearchResults(res || [])
            setIsSearching(false)
        }
        fetchUsers()
    }, [debouncedQuery])


    const handleSlotClick = async (date: Date, hour: number, capacity: number, isBooked: boolean, bookings: Booking[]) => {
        if (loading) return

        if (isAdmin) {
            setSelectedSlot({ date, hour, bookings })
            setSearchQuery('')
            setSearchResults([])
            return
        }

        if (capacity >= MAX_CAPACITY && !isBooked) return // Full

        const slotId = `${format(date, 'yyyy-MM-dd')}-${hour}`
        setLoading(slotId)

        try {
            if (isBooked) {
                // Cancel Check
                const dateStr = format(date, 'yyyy-MM-dd')
                const classIsoString = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00.000-03:00`
                const classDate = new Date(classIsoString)
                const now = new Date()
                const minutesUntilClass = differenceInMinutes(classDate, now)

                if (minutesUntilClass <= 120) {
                    toast.error('No puedes cancelar con menos de 2 horas de anticipación.')
                    setLoading(null)
                    return
                }

                // Cancel
                const res = await cancelBooking(date, hour)
                if (res.error) toast.error(res.error)
                else toast.success('Reserva cancelada')
            } else {
                // Book
                const res = await bookSlot(date, hour)
                if (res.error) toast.error(res.error)
                else toast.success('¡Turno reservado!')
            }
            if (onBookingChange) {
                onBookingChange()
            } else {
                router.refresh()
            }
        } catch (error) {
            toast.error('Ocurrió un error')
        } finally {
            setLoading(null)
        }
    }

    const handleAdminDelete = async (targetUserId: string) => {
        if (!selectedSlot) return
        const toastId = toast.loading('Eliminando reserva...')
        const res = await adminCancelBooking(selectedSlot.date, selectedSlot.hour, targetUserId)

        if (res.error) {
            toast.error(res.error, { id: toastId })
        } else {
            toast.success('Reserva eliminada', { id: toastId })
            refreshData()
            // Optimistic update for UI in modal
            setSelectedSlot(prev => prev ? ({ ...prev, bookings: prev.bookings.filter(b => b.user_id !== targetUserId) }) : null)
        }
    }

    const handleAdminAdd = async (targetUserId: string) => {
        if (!selectedSlot) return
        const toastId = toast.loading('Agregando alumno...')
        const res = await adminBookSlot(selectedSlot.date, selectedSlot.hour, targetUserId)

        if (res.error) {
            toast.error(res.error, { id: toastId })
        } else {
            toast.success('Alumno agregado', { id: toastId })
            refreshData()
            setSelectedSlot(null) // Close modal or update? Closing is safer to force refresh
        }
    }

    const refreshData = () => {
        if (onBookingChange) onBookingChange()
        else router.refresh()
    }

    return (
        <div className="w-full overflow-x-auto pb-4">
            {allHours.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border-dashed border-2">
                    <div className="p-3 bg-muted rounded-full mb-3">
                        <X className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg">No hay turnos disponibles</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                        No se encontraron horarios configurados. Contacta a administración.
                    </p>
                </div>
            ) : (
                <div className="min-w-[1000px] grid grid-cols-6 gap-4">
                    {/* Time Column Header */}
                    <div className="pt-12"></div>

                    {/* Days Headers */}
                    {weekDays.map((day) => (
                        <div key={day.toString()} className="text-center p-4 bg-background rounded-lg border font-bold uppercase text-sm tracking-wider">
                            {format(day, 'EEEE', { locale: es })}
                        </div>
                    ))}

                    {/* Grid Rows */}
                    {allHours.map((hour) => {
                        const isSeparate = afternoonHours.includes(hour) && !afternoonHours.includes(hour - 1) && hour !== allHours[0]

                        return (
                            <Fragment key={hour}>
                                {isSeparate && <div className="col-span-6 h-8 flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-30">--- Turno Tarde ---</div>}

                                {/* Time Label */}
                                <div className="flex items-center justify-center font-mono text-sm font-medium text-muted-foreground">
                                    {hour}:00
                                </div>

                                {/* Day Slots */}
                                {weekDays.map((day) => {
                                    const dateStr = format(day, 'yyyy-MM-dd')
                                    const slotBookings = initialBookings.filter(b => b.date === dateStr && b.hour === hour)
                                    const count = slotBookings.length
                                    const isBooked = slotBookings.some(b => b.user_id === userId)
                                    const isFull = count >= MAX_CAPACITY
                                    const isLoading = loading === `${dateStr}-${hour}`

                                    // Check cancellation capability for UI
                                    const classIsoString = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00.000-03:00`
                                    const classDate = new Date(classIsoString)
                                    const now = new Date()
                                    const minutesUntilClass = differenceInMinutes(classDate, now)

                                    const isPast = minutesUntilClass < 0
                                    const canCancel = minutesUntilClass > 120

                                    let stateClass = "border-border bg-card text-card-foreground hover:border-primary/50" // Default Available
                                    if (isBooked) stateClass = "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300" // My Booking
                                    else if (isFull) stateClass = "border-transparent bg-muted/50 text-muted-foreground opacity-70 cursor-not-allowed" // Full

                                    if (isPast) {
                                        stateClass = "border-transparent bg-muted/20 text-muted-foreground opacity-50 cursor-not-allowed" // Past Slot
                                        if (isBooked) stateClass = "border-blue-200 bg-blue-50/20 text-blue-400 opacity-60" // Past Booking
                                    }

                                    if (isAdmin) {
                                        stateClass = "border-border bg-card text-card-foreground hover:border-blue-500 hover:shadow-md cursor-pointer"
                                        if (count > 0) {
                                            stateClass = "border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20 text-card-foreground shadow-sm hover:border-indigo-600 hover:shadow-md cursor-pointer"
                                        }
                                    }

                                    return (
                                        <div
                                            key={`${dateStr}-${hour}`}
                                            className={cn(
                                                "relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-24 group",
                                                stateClass,
                                                isLoading && "opacity-50 pointer-events-none",
                                                !canCancel && isBooked && !isAdmin && !isPast && "opacity-80" // Slightly dim if locked
                                            )}
                                            onClick={() => {
                                                if (isPast && !isAdmin) return
                                                handleSlotClick(day, hour, count, isBooked, slotBookings)
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-lg">{hour}:00</span>
                                                {isBooked && !isAdmin && (
                                                    canCancel
                                                        ? <div className="bg-blue-500 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></div>
                                                        : <div className="bg-red-500 text-white rounded-full p-0.5" title="No se puede cancelar"><Lock className="w-3 h-3" /></div>
                                                )}
                                                {isFull && !isBooked && !isAdmin && <Badge variant="secondary" className="text-[10px] h-4 px-1">LLENO</Badge>}
                                                {isAdmin && count >= MAX_CAPACITY && <Badge variant="destructive" className="text-[10px] h-4 px-1">LLENO</Badge>}
                                            </div>

                                            <div className="space-y-2">
                                                {/* Circles Indicator */}
                                                <div className="flex gap-1">
                                                    {[...Array(MAX_CAPACITY)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "w-3 h-3 rounded-full transition-colors",
                                                                i < count
                                                                    ? (isBooked && i === count - 1 ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600") // Filled
                                                                    : "bg-zinc-100 dark:bg-zinc-800" // Empty
                                                            )}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="flex justify-between items-center text-xs font-medium">
                                                    <span className={isBooked ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}>
                                                        {isAdmin ? `${count}/${MAX_CAPACITY}` : (isBooked ? 'Tu Turno' : (isFull ? 'Completo' : 'Disponible'))}
                                                    </span>
                                                    {!isAdmin && <span className="opacity-70">{count}/{MAX_CAPACITY}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </Fragment>
                        )
                    })}
                </div>
            )}

            {/* Admin Modal */}
            <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gestión de Turno</DialogTitle>
                        <DialogDescription>
                            {selectedSlot && format(selectedSlot.date, "EEEE d 'de' MMMM", { locale: es })} - {selectedSlot?.hour}:00
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Enrolled Students */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Alumnos Inscriptos ({selectedSlot?.bookings.length}/{MAX_CAPACITY})</h4>
                            <div className="space-y-2">
                                {selectedSlot?.bookings.length === 0 && <p className="text-sm text-muted-foreground italic">No hay alumnos inscriptos.</p>}
                                {selectedSlot?.bookings.map(b => (
                                    <div key={b.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{b.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">
                                                <div className="font-medium">{b.profiles?.full_name || 'Sin Nombre'}</div>
                                                <div className="text-xs text-muted-foreground">{b.profiles?.dni || 'Sin DNI'}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleAdminDelete(b.user_id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Student */}
                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="text-sm font-medium text-muted-foreground">Inscribir Alumno Manualmente</h4>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre o DNI..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                                    {searchResults.map(user => {
                                        // Check if already booked
                                        const isAlready = selectedSlot?.bookings.some(b => b.user_id === user.id)

                                        return (
                                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted/50 transition-colors">
                                                <div className="text-sm truncate pr-2">
                                                    <span className="font-medium">{user.full_name || 'Sin Nombre'}</span>
                                                    <span className="text-muted-foreground ml-2 text-xs">({user.dni})</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-xs"
                                                    disabled={isAlready || (selectedSlot?.bookings.length || 0) >= MAX_CAPACITY}
                                                    onClick={() => handleAdminAdd(user.id)}
                                                >
                                                    {isAlready ? 'Inscripto' : 'Agregar'}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                <p className="text-xs text-center text-muted-foreground py-2">No se encontraron alumnos.</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
