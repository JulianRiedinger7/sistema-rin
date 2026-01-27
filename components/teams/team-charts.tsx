'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

interface TeamChartsProps {
    data: {
        [division: string]: {
            bueno: number;
            regular: number;
            malo: number;
        }
    }
}

const COLORS = {
    bueno: '#22c55e', // green-500
    regular: '#eab308', // yellow-500
    malo: '#ef4444'   // red-500
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0 ? (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

export function TeamCharts({ data }: TeamChartsProps) {
    const divisions = Object.keys(data).sort(); // Sort divisions alphabetically

    if (divisions.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {divisions.map((division) => {
                const divisionData = data[division];
                const totalTests = divisionData.bueno + divisionData.regular + divisionData.malo;

                const chartData: ChartData[] = [
                    { name: 'Bueno', value: divisionData.bueno },
                    { name: 'Regular', value: divisionData.regular },
                    { name: 'Malo', value: divisionData.malo },
                ].filter(item => item.value > 0);

                return (
                    <div key={division} className="bg-card border border-border rounded-lg p-6 flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-4 capitalize">
                            {division || 'Sin División'}
                            <span className="text-muted-foreground text-sm font-normal ml-2">
                                ({totalTests} testeos)
                            </span>
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => {
                                            const key = entry.name.toLowerCase() as keyof typeof COLORS;
                                            return <Cell key={`cell-${index}`} fill={COLORS[key]} />;
                                        })}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
