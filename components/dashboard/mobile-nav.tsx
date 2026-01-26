'use client'

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface MobileNavProps {
    role: 'admin' | 'student'
}

export function MobileNav({ role }: MobileNavProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sheet when route changes
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <div className="flex h-14 items-center border-b border-border bg-background px-3 md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-1.5 shrink-0">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r border-border bg-card w-64">
                    <div className="sr-only">
                        <SheetTitle>Menu de Navegación</SheetTitle>
                    </div>
                    {/* Reuse Sidebar logic but adapted visually if needed, or simplly reuse the component structure */}
                    <div className="h-full">
                        <Sidebar role={role} className="flex w-full" />
                    </div>
                </SheetContent>
            </Sheet>
            <Image
                src="/logo.png"
                alt="R.I.N."
                width={70}
                height={24}
                className="object-contain"
                priority
            />
        </div>
    )
}
