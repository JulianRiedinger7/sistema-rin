import { startOfMonth, endOfMonth, startOfWeek, addWeeks, addDays, format, isBefore, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'

export interface WeekInfo {
    weekNum: number
    start: Date      // Monday of this calendar week
    days: Date[]     // Only Mon-Fri days that belong to the target month
    label: string
    dateRange: string
}

/**
 * Returns an array of weeks for the given month.
 * Each week only contains the weekdays (Mon-Fri) that fall within the month.
 * A month can have 4, 5 or even 6 week-tabs depending on how the days fall.
 */
export function getWeeksInMonth(date: Date): WeekInfo[] {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const targetMonth = monthStart.getMonth()

    // Start from the Monday of the week containing the 1st
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })

    const weeks: WeekInfo[] = []
    let weekNum = 1

    while (currentWeekStart <= monthEnd) {
        // Collect only Mon-Fri days that belong to the target month
        const days: Date[] = []
        for (let i = 0; i < 5; i++) {
            const day = addDays(currentWeekStart, i)
            if (day.getMonth() === targetMonth && day.getFullYear() === monthStart.getFullYear()) {
                days.push(new Date(day))
            }
        }

        if (days.length > 0) {
            const first = days[0]
            const last = days[days.length - 1]

            weeks.push({
                weekNum,
                start: new Date(currentWeekStart),
                days,
                label: `Semana ${weekNum}`,
                dateRange: `${format(first, "EEEE d", { locale: es })} al ${format(last, "EEEE d 'de' MMMM", { locale: es })}`
            })
            weekNum++
        }

        currentWeekStart = addWeeks(currentWeekStart, 1)
    }

    return weeks
}
