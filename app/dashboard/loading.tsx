import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="container py-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-24 w-full md:w-64" />
            </div>

            <div className="space-y-6">
                <div className="grid w-full grid-cols-5 h-12 gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-full rounded-lg" />
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[80%]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
