'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Users,
    Dumbbell,
    CalendarDays,
    CreditCard,
    LayoutDashboard,
    LogOut,
    BicepsFlexed,
    TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const adminLinks = [
    { href: '/dashboard/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Alumnos', icon: Users },
    { href: '/dashboard/admin/exercises', label: 'Ejercicios', icon: Dumbbell },
    { href: '/dashboard/admin/routines', label: 'Rutinas', icon: BicepsFlexed },
    { href: '/dashboard/admin/tests', label: 'Testeos', icon: TrendingUp },
    { href: '/dashboard/admin/pilates', label: 'Pilates', icon: CalendarDays },
    { href: '/dashboard/admin/payments', label: 'Pagos', icon: CreditCard },
]

const studentLinks = [
    { href: '/dashboard/student', label: 'Mi Entrenamiento', icon: LayoutDashboard },
    { href: '/dashboard/student/progress', label: 'Mi Progreso', icon: TrendingUp },
    { href: '/dashboard/student/profile', label: 'Mi Perfil', icon: Users },
    { href: '/dashboard/student/pilates', label: 'Reservar Pilates', icon: CalendarDays },
]

interface SidebarProps {
    role: 'admin' | 'student'
}

export function Sidebar({ role, className }: SidebarProps & { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const links = role === 'admin' ? adminLinks : studentLinks

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <aside className={cn("h-full w-64 flex flex-col border-r border-border bg-card text-card-foreground text-sm", className)}>
            <div className="flex h-16 items-center border-b border-border px-4 shrink-0">
                <Image
                    src="/logo.png"
                    alt="R.I.N. Centro Integral de Salud Deportiva"
                    width={160}
                    height={56}
                    className="object-contain"
                    priority
                />
            </div>
            <nav className="flex-1 overflow-y-auto py-2 min-h-0">
                <ul className="space-y-0.5 px-3">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)

                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
            <div className="border-t border-border p-3 mt-auto">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </aside>
    )
}
