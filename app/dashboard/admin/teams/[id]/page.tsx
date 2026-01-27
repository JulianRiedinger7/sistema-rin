import { Button } from "@/components/ui/button";
import { ArrowLeft, User, BarChart } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { CreatePlayerDialog } from "../create-player-dialog";
import { AssessmentConfigDialog } from "@/components/teams/assessment-config-dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { deletePlayer } from "../actions";

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function TeamDetailPage({ params }: PageProps) {
    const supabase = await createClient();
    const { id } = await params;
    const { data: team } = await supabase.from("teams").select("*").eq("id", id).single();

    if (!team) {
        notFound();
    }

    const { data: players } = await supabase
        .from("team_players")
        .select("*")
        .eq("team_id", team.id)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/admin/teams">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-primary">{team.name}</h1>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Jugadores
                    </h2>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/admin/teams/${team.id}/analysis`} className="flex items-center gap-2">
                                <BarChart className="h-4 w-4" />
                                Ver Análisis
                            </Link>
                        </Button>
                        <AssessmentConfigDialog teamId={team.id} />
                        <CreatePlayerDialog teamId={team.id} />
                    </div>
                </div>

                <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Apellido</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Altura</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Peso</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players?.map((player) => (
                                <tr key={player.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                    <td className="p-4 align-middle">{player.first_name}</td>
                                    <td className="p-4 align-middle">{player.last_name}</td>
                                    <td className="p-4 align-middle">{player.height ? `${player.height} cm` : '-'}</td>
                                    <td className="p-4 align-middle">{player.weight ? `${player.weight} kg` : '-'}</td>
                                    <td className="p-4 align-middle text-right flex justify-end items-center gap-2">
                                        <DeleteButton
                                            onDelete={async () => {
                                                'use server'
                                                await deletePlayer(player.id, team.id)
                                            }}
                                            description="Se eliminarán todos los testeos asociados a este jugador."
                                        />
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/admin/teams/${team.id}/players/${player.id}`}>
                                                Ver Testeos
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {players?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        No hay jugadores en este equipo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
