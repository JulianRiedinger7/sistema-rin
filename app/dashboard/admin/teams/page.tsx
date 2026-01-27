import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { CreateTeamDialog } from "./create-team-dialog";
import { AssessmentConfigDialog } from "@/components/teams/assessment-config-dialog";
import { TeamDeleteAction } from "@/components/teams/team-delete-action";

export default async function TeamsPage() {
    const supabase = await createClient();
    const { data: teams } = await supabase.from("teams").select("*").order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Users className="h-8 w-8" />
                    Gestión de Equipos
                </h1>
                <div className="self-start sm:self-auto flex gap-2">
                    <CreateTeamDialog />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams?.map((team) => (
                    <Link
                        key={team.id}
                        href={`/dashboard/admin/teams/${team.id}`}
                        className="block p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors relative group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold">{team.name}</h3>
                            <TeamDeleteAction teamId={team.id} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Ver integrantes y testeos
                        </p>
                    </Link>
                ))}
                {teams?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No hay equipos creados.
                    </div>
                )}
            </div>
        </div>
    );
}
