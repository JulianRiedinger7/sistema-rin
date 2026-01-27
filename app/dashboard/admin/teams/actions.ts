'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTeam(name: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('teams')
        .insert({ name });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard/admin/teams');
}

export async function createPlayer(teamId: string, data: { first_name: string, last_name: string, height?: number, weight?: number }) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('team_players')
        .insert({
            team_id: teamId,
            first_name: data.first_name,
            last_name: data.last_name,
            height: data.height,
            weight: data.weight
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/dashboard/admin/teams/${teamId}`);
}

export async function createAssessment(
    playerId: string,
    teamId: string,
    data: {
        exercise: string,
        value: number,
        date: string,
        metrics?: any,
        notes?: string
    }
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('player_assessments')
        .insert({
            player_id: playerId,
            exercise: data.exercise,
            value: data.value,
            date: data.date,
            metrics: data.metrics,
            notes: data.notes
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/dashboard/admin/teams/${teamId}/players/${playerId}`);
}

export async function getTeamConfig(teamId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('teams')
        .select('config')
        .eq('id', teamId)
        .single();

    if (error) return null;
    return data.config?.cmj || null;
}

export async function updateTeamConfig(teamId: string, config: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('teams')
        .update({
            config: { cmj: config } // Nesting under 'cmj' for key management if we add more configs later
        })
        .eq('id', teamId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/dashboard/admin/teams/${teamId}`);
}

export async function deleteTeam(teamId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard/admin/teams');
}

export async function deletePlayer(playerId: string, teamId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', playerId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/dashboard/admin/teams/${teamId}`);
}

export async function deleteAssessment(assessmentId: string, playerId: string, teamId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('player_assessments')
        .delete()
        .eq('id', assessmentId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/dashboard/admin/teams/${teamId}/players/${playerId}`);
}
