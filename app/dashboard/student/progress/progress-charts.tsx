'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useMemo } from 'react'
import { TrendingUp, User } from 'lucide-react'

interface Log {
    id: string
    exercise_type: string
    weight: number
    date: string
}

interface ProgressChartsProps {
    logs: Log[]
}

const EXERCISES = ['Sentadilla', 'Hip Thrust', 'Banco Plano', 'Remo', 'Dominadas']

const BORG_SCALE = [
    { zone: 10, label: 'Máximo', desc: 'Esfuerzo máximo posible.', color: 'bg-red-500 text-white' },
    { zone: 9, label: 'Muy Duro', desc: 'Casi al fallo, 1 repetición más.', color: 'bg-red-400 text-white' },
    { zone: 8, label: 'Duro', desc: 'Podrías hacer 2 repeticiones más.', color: 'bg-amber-100 text-amber-900 border-amber-200' },
    { zone: 7, label: 'Vigoroso', desc: 'Podrías hacer 3 repeticiones más.', color: 'bg-lime-100 text-lime-900 border-lime-200' },
    { zone: 6, label: 'Moderado+', desc: 'Movimiento rápido, algo de fatiga.', color: 'bg-green-100 text-green-900 border-green-200' },
    { zone: 5, label: 'Moderado', desc: 'Entrada en calor pesada.', color: 'bg-emerald-50 text-emerald-900 border-emerald-100' },
    { zone: 4, label: 'Suave', desc: 'Recuperación activa.', color: 'bg-slate-50 text-slate-900' },
    { zone: 3, label: 'Muy Suave', desc: 'Movimiento sin carga.', color: 'bg-slate-50 text-slate-500' },
    { zone: 2, label: 'Extremadamente Suave', desc: '', color: 'bg-slate-50 text-slate-300' },
    { zone: 1, label: 'Reposo', desc: '', color: 'bg-slate-50 text-slate-200' },
]

export function ProgressCharts({ logs }: ProgressChartsProps) {
    const [selectedExercise, setSelectedExercise] = useState('Sentadilla')

    // Get max weight per exercise for the sidebar
    const maxWeights = useMemo(() => {
        const maxes: Record<string, number> = {}
        EXERCISES.forEach(ex => maxes[ex] = 0)

        logs.forEach(log => {
            if (log.weight > (maxes[log.exercise_type] || 0)) {
                maxes[log.exercise_type] = log.weight
            }
        })
        return maxes
    }, [logs])

    // Filter data for chart
    const chartData = useMemo(() => {
        return logs
            .filter(log => log.exercise_type === selectedExercise)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(log => {
                // Fix date issue by parsing YYYY-MM-DD manually to avoid UTC offset issues
                const [year, month, day] = log.date.split('-').map(Number)
                const dateObj = new Date(year, month - 1, day)

                return {
                    date: dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
                    weight: log.weight
                }
            })
    }, [logs, selectedExercise])

    const calculateWeight = (zone: number) => {
        const max = maxWeights[selectedExercise] || 0
        const weight = max * (zone / 10)
        return Math.round(weight * 10) / 10
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar: Maxes */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Testeo de Fuerza
                        </CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {EXERCISES.map(exercise => (
                            <button
                                type="button"
                                key={exercise}
                                className={`w-full flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-left ${selectedExercise === exercise
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-muted bg-card'
                                    }`}
                                onClick={() => setSelectedExercise(exercise)}
                            >
                                <span className={`font-medium ${selectedExercise === exercise ? 'text-primary' : ''}`}>
                                    {exercise}
                                </span>
                                <span className="font-bold text-lg">
                                    {maxWeights[exercise] || '-'} <span className="text-xs font-normal text-muted-foreground">{exercise === 'Dominadas' ? 'reps' : 'kg'}</span>
                                </span>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Main: Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <CardTitle>Progreso Interactivo</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {EXERCISES.map((ex) => (
                                <Badge
                                    key={ex}
                                    variant={selectedExercise === ex ? "default" : "outline"}
                                    className={`cursor-pointer ${selectedExercise === ex ? 'bg-blue-900 text-white hover:bg-blue-800' : 'text-muted-foreground'}`}
                                    onClick={() => setSelectedExercise(ex)}
                                >
                                    {ex}
                                </Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-6 justify-center">
                            <span className="text-blue-400 font-medium">● {selectedExercise}</span>
                        </div>

                        <div className="h-[300px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#0ea5e9"
                                            strokeWidth={3}
                                            dot={{ fill: '#0ea5e9', r: 4, stroke: '#000', strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-md">
                                    No hay datos registrados para {selectedExercise}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Zones Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">📊</span> Zonas de Entrenamiento - <span className="text-primary">{selectedExercise}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Pesos calculados basados en tu máximo registrado de {maxWeights[selectedExercise] || 0}{selectedExercise === 'Dominadas' ? 'reps' : 'kg'}.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {BORG_SCALE.map((item) => (
                            <div
                                key={item.zone}
                                className={`p-4 rounded-lg border flex flex-col justify-between h-full ${item.color.includes('bg-') ? item.color : 'bg-card text-card-foreground border-border'}`}
                                style={item.color && !item.color.includes('bg-') ? { backgroundColor: item.color } : {}}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg opacity-80">Zona {item.zone}</span>
                                    <span className="text-2xl font-bold">{calculateWeight(item.zone)}<span className="text-sm font-normal">{selectedExercise === 'Dominadas' ? 'reps' : 'kg'}</span></span>
                                </div>
                                <div>
                                    <div className="font-semibold text-sm mb-1">{item.label}</div>
                                    <div className="text-xs opacity-80">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
