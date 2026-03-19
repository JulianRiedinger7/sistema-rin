'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { updatePrice } from './actions'
import { Loader2, Edit2, Save, X, Dumbbell, PersonStanding, Combine } from 'lucide-react'
import { PRICE_ITEMS } from '@/lib/activity-types'

interface Price {
    activity_type: string
    price: number
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
    'Gimnasio': <Dumbbell className="h-5 w-5 text-blue-500" />,
    'Pilates': <PersonStanding className="h-5 w-5 text-purple-500" />,
    'Mixto': <Combine className="h-5 w-5 text-emerald-500" />,
}

const GROUP_COLORS: Record<string, string> = {
    'Gimnasio': 'border-l-blue-500',
    'Pilates': 'border-l-purple-500',
    'Mixto': 'border-l-emerald-500',
}

export function PriceConfig({ prices }: { prices: Price[] }) {
    const getPrice = (key: string) => prices.find(p => p.activity_type === key)?.price || 0

    // Group price items
    const groups = PRICE_ITEMS.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = []
        acc[item.group].push(item)
        return acc
    }, {} as Record<string, typeof PRICE_ITEMS[number][]>)

    return (
        <div className="space-y-6">
            {Object.entries(groups).map(([groupName, items]) => (
                <Card key={groupName} className={`border-l-4 ${GROUP_COLORS[groupName] || ''}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {GROUP_ICONS[groupName]}
                            {groupName}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {items.map(item => (
                            <PriceRow
                                key={item.key}
                                priceKey={item.key}
                                label={item.label}
                                description={item.description}
                                initialPrice={getPrice(item.key)}
                            />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function PriceRow({ priceKey, label, description, initialPrice }: { 
    priceKey: string
    label: string 
    description: string
    initialPrice: number 
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [price, setPrice] = useState(initialPrice.toString())
    const [currentPrice, setCurrentPrice] = useState(initialPrice)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const res = await updatePrice(priceKey, Number(price))
        setLoading(false)
        if (res?.error) {
            alert('Error al actualizar precio: ' + res.error)
        } else {
            setCurrentPrice(Number(price))
            setIsEditing(false)
        }
    }

    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5 flex-1 min-w-0">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
            </div>

            <div className="flex items-center gap-2 ml-4 shrink-0">
                {isEditing ? (
                    <>
                        <div className="relative w-28">
                            <span className="absolute left-2.5 top-2 text-muted-foreground text-sm">$</span>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-6 h-8 text-sm"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setIsEditing(false); setPrice(currentPrice.toString()) } }}
                            />
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={() => { setIsEditing(false); setPrice(currentPrice.toString()) }}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </>
                ) : (
                    <>
                        <span className="text-lg font-bold text-primary mr-2">${currentPrice.toLocaleString('es-AR')}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
