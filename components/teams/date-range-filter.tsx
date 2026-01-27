"use client"

import * as React from "react"
import { addDays, format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subDays, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Check } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter, useSearchParams } from "next/navigation"

interface DateRangeFilterProps {
    className?: string
}

export function DateRangeFilter({ className }: DateRangeFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
        to: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    })

    // Derived state to keep the input in sync if URL changes externally (optional, but good practice)
    React.useEffect(() => {
        const fromParam = searchParams.get("startDate")
        const toParam = searchParams.get("endDate")
        if (fromParam && toParam) {
            setDate({
                from: new Date(fromParam),
                to: new Date(toParam)
            })
        }
    }, [searchParams])


    const onSelect = (range: DateRange | undefined) => {
        setDate(range)

        if (range?.from) {
            const params = new URLSearchParams(searchParams.toString())
            params.set("startDate", format(range.from, "yyyy-MM-dd"))

            if (range.to) {
                params.set("endDate", format(range.to, "yyyy-MM-dd"))
            } else {
                params.delete("endDate")
            }

            router.push(`?${params.toString()}`)
        } else {
            // Only clear if explicitly undefined (e.g. cleared), though day-picker usually just updates selection
            if (range === undefined) {
                const params = new URLSearchParams(searchParams.toString())
                params.delete("startDate")
                params.delete("endDate")
                router.push(`?${params.toString()}`)
            }
        }
    }

    const presets = [
        {
            label: 'Hoy',
            getValue: () => {
                const today = new Date()
                return { from: today, to: today }
            }
        },
        {
            label: 'Ayer',
            getValue: () => {
                const yesterday = subDays(new Date(), 1)
                return { from: yesterday, to: yesterday }
            }
        },
        {
            label: 'Últimos 7 días',
            getValue: () => {
                const today = new Date()
                return { from: subDays(today, 6), to: today }
            }
        },
        {
            label: 'Últimos 30 días',
            getValue: () => {
                const today = new Date()
                return { from: subDays(today, 29), to: today }
            }
        },
        {
            label: 'Este mes',
            getValue: () => {
                const today = new Date()
                return { from: startOfMonth(today), to: endOfMonth(today) }
            }
        },
        {
            label: 'Mes pasado',
            getValue: () => {
                const lastMonth = subMonths(new Date(), 1)
                return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
            }
        },
        {
            label: 'Este año',
            getValue: () => {
                const today = new Date()
                return { from: startOfYear(today), to: endOfYear(today) }
            }
        }
    ]

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "d 'de' MMM, y", { locale: es })} -{" "}
                                    {format(date.to, "d 'de' MMM, y", { locale: es })}
                                </>
                            ) : (
                                format(date.from, "d 'de' MMM, y", { locale: es })
                            )
                        ) : (
                            <span>Filtrar por fecha</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="border-r border-border p-2 space-y-1 min-w-[140px]">
                            {presets.map((preset) => {
                                const presetRange = preset.getValue()
                                const isSelected =
                                    date?.from?.getTime() === presetRange.from.getTime() &&
                                    date?.to?.getTime() === presetRange.to?.getTime()

                                return (
                                    <Button
                                        key={preset.label}
                                        variant={isSelected ? "secondary" : "ghost"}
                                        className="w-full justify-start font-normal text-sm h-8"
                                        onClick={() => onSelect(presetRange)}
                                    >
                                        <span className="flex-1 text-left">{preset.label}</span>
                                        {isSelected && <Check className="ml-auto h-3 w-3" />}
                                    </Button>
                                )
                            })}
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={onSelect}
                            numberOfMonths={2}
                            locale={es}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
