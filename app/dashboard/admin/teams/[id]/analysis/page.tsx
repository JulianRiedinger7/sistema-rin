import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { TeamCharts } from "@/components/teams/team-charts";
import { DateRangeFilter } from "@/components/teams/date-range-filter";

interface PageProps {
    params: Promise<{
        id: string
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TeamAnalysisPage({ params, searchParams }: PageProps) {
    const supabase = await createClient();
    const { id } = await params;
    const { startDate, endDate } = await searchParams;

    const { data: team } = await supabase.from("teams").select("*").eq("id", id).single();

    if (!team) {
        notFound();
    }

    // Fetch all assessments for this team to build charts
    let query = supabase
        .from("player_assessments")
        .select(`
            metrics,
            date,
            team_players!inner (
                team_id
            )
        `)
        .eq("team_players.team_id", team.id);

    // Apply filters if present
    if (startDate) {
        query = query.gte('date', startDate as string);
    }
    if (endDate) {
        query = query.lte('date', endDate as string);
    }

    const { data: teamAssessments } = await query;

    // Process data for charts
    const chartData: { [division: string]: { bueno: number; regular: number; malo: number } } = {};

    teamAssessments?.forEach((assessment: any) => {
        const division = (assessment.metrics?.division || 'Sin División').trim().toLowerCase();
        // Capitalize for display
        const displayDivision = division.replace(/\b\w/g, (c: string) => c.toUpperCase());

        const rating = assessment.metrics?.rating || 'bueno';

        if (!chartData[displayDivision]) {
            chartData[displayDivision] = { bueno: 0, regular: 0, malo: 0 };
        }

        if (rating === 'bueno' || rating === 'regular' || rating === 'malo') {
            chartData[displayDivision][rating as 'bueno' | 'regular' | 'malo']++;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/admin/teams/${team.id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-primary">Análisis de {team.name}</h1>
                </div>
                <DateRangeFilter />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Análisis por División</h2>

                {Object.keys(chartData).length > 0 ? (
                    <TeamCharts data={chartData} />
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        No hay datos suficientes para mostrar el análisis {startDate && endDate ? 'en este rango de fechas' : ''}.
                    </div>
                )}
            </div>
        </div>
    );
}
