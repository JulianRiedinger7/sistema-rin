'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { updatePrice } from './actions'
import { Loader2, Edit2, Save, X } from 'lucide-react'

interface Price {
    activity_type: string
    price: number
}

const ACTIVITY_LABELS: Record<string, string> = {
    'gym': 'Gimnasio',
    'pilates': 'Pilates',
    'mixed': 'Mixto (Gym + Pilates)'
}

export function PriceConfig({ prices }: { prices: Price[] }) {
    // We'll manage local state for optimistic UI or just simpler editing
    // Ensure we have defaults if DB is empty for some reason
    const getPrice = (type: string) => prices.find(p => p.activity_type === type)?.price || 0

    return (
        <div className="space-y-4">
            {['gym', 'pilates', 'mixed'].map((type) => (
                <PriceRow
                    key={type}
                    type={type}
                    initialPrice={getPrice(type)}
                />
            ))}
        </div>
    )
}

function PriceRow({ type, initialPrice }: { type: string, initialPrice: number }) {
    const [isEditing, setIsEditing] = useState(false)
    const [price, setPrice] = useState(initialPrice.toString())
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const res = await updatePrice(type, Number(price))
        setLoading(false)
        if (res?.error) {
            alert('Error al actualizar precio: ' + res.error)
        } else {
            setIsEditing(false)
        }
    }

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="space-y-1">
                <Label className="font-medium text-base">{ACTIVITY_LABELS[type] || type}</Label>
                {!isEditing && (
                    <p className="text-xl font-bold text-primary">${initialPrice.toLocaleString()}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <div className="relative w-32">
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-6 h-9"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:bg-red-100" onClick={() => { setIsEditing(false); setPrice(initialPrice.toString()); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-3 w-3" /> Editar
                    </Button>
                )}
            </div>
        </div>
    )
}
