import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-'
  // Handle ISO strings or just dates
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'

  // Use Intl.DateTimeFormat for consistent formatting
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC' // Assuming dates are stored as UTC or date-only strings should be treated as such to avoid shifting
  }).format(date)
}
