'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings } from 'lucide-react'
import { PriceConfig } from './price-config'

export function PriceConfigDialog({ prices }: { prices: any[] }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Configuración de Precios</DialogTitle>
                    <DialogDescription>
                        Ajusta los valores para cada actividad.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <PriceConfig prices={prices} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
