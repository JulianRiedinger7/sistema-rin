import { Button } from "@/components/ui/button";
import { ArrowLeft, User, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { CreateAssessmentDialog } from "../../../create-assessment-dialog";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteAssessment } from "../../../actions";

interface PageProps {
    params: Promise<{
        id: string
        playerId: string
    }>
}

export default async function PlayerDetailPage({ params }: PageProps) {
    const supabase = await createClient();
    const { id, playerId } = await params;

    // Fetch player and team info
    const { data: player } = await supabase
        .from("team_players")
        .select("*, teams(name)")
        .eq("id", playerId)
        .single();

    if (!player) {
        notFound();
    }

    // Fetch assessments
    const { data: assessments } = await supabase
        .from("player_assessments")
        .select("*")
        .eq("player_id", player.id)
        .order("date", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/admin/teams/${id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-primary">{player.first_name} {player.last_name}</h1>
                    <p className="text-muted-foreground">
                        {player.teams?.name} • Altura: {player.height || '-'} cm • Peso: {player.weight || '-'} kg
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Historial de Testeos
                    </h2>
                    <CreateAssessmentDialog playerId={player.id} teamId={id} />
                </div>

                <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">División</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Ejercicio</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">CMJ (cm)</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Izq (cm)</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Der (cm)</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Dif %</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Rating</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Obs</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments?.map((assessment) => {
                                const metrics = assessment.metrics || {};
                                const rating = metrics.rating || 'bueno';
                                const ratingColor =
                                    rating === 'bueno' ? 'bg-green-500 hover:bg-green-600' :
                                        rating === 'regular' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                            'bg-red-500 hover:bg-red-600';

                                return (
                                    <tr key={assessment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="p-4 align-middle whitespace-nowrap">{formatDate(assessment.date)}</td>
                                        <td className="p-4 align-middle">{metrics.division || '-'}</td>
                                        <td className="p-4 align-middle font-medium">{assessment.exercise}</td>
                                        <td className="p-4 align-middle font-bold">{assessment.value}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{metrics.cmj_left || '-'}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{metrics.cmj_right || '-'}</td>
                                        <td className="p-4 align-middle font-mono">
                                            {metrics.diff_percent ? `${metrics.diff_percent}%` : '-'}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {metrics.rating ? (
                                                <Badge className={`${ratingColor} text-white capitalize`}>
                                                    {rating}
                                                </Badge>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-sm text-muted-foreground max-w-[200px] truncate" title={assessment.notes}>
                                            {assessment.notes || '-'}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <DeleteButton
                                                onDelete={async () => {
                                                    'use server'
                                                    await deleteAssessment(assessment.id, playerId, id)
                                                }}
                                                description="Se eliminará este registro de testeo permanentemente."
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                            {assessments?.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                        No hay testeos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
