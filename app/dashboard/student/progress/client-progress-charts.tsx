'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
// Type import to ensure props are correct, though dynamic infers it usually
import { ProgressCharts as ProgressChartsType } from './progress-charts'

export const ClientProgressCharts = dynamic(() => import('./progress-charts').then(mod => mod.ProgressCharts), {
    loading: () => <Skeleton className="h-[400px] w-full rounded-xl" />,
    ssr: false
})
