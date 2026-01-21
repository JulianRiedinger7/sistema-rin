'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Updated Schema
const OnboardingSchema = z.object({
    // Personal Data
    dni: z.string().min(6, "DNI inválido"),
    phone: z.string().min(6, "Teléfono inválido"),
    address: z.string().min(1, "Domicilio requerido"),
    emergencyPhone: z.string().min(6, "Teléfono de emergencia inválido"),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    activityType: z.enum(["gym", "pilates", "mixed"]),

    // Metrics
    weight: z.string().min(1, "Peso requerido"),
    height: z.string().min(1, "Altura requerida"),

    // Health Questionnaire (Booleans and details)
    hasChronicDisease: z.enum(["yes", "no"]),
    chronicDiseaseDetails: z.string().optional(),

    hasAllergies: z.enum(["yes", "no"]),
    allergiesDetails: z.string().optional(),

    isUnderTreatment: z.enum(["yes", "no"]),
    treatmentDetails: z.string().optional(),

    takesMedication: z.enum(["yes", "no"]),
    medicationDetails: z.string().optional(),

    hadSurgery: z.enum(["yes", "no"]),
    surgeryDetails: z.string().optional(),

    hasPhysicalLimitation: z.enum(["yes", "no"]),
    limitationDetails: z.string().optional(),

    // Legacy fields mapped or new fields?
    goals: z.string().min(1, "Debes especificar al menos un objetivo"),

    // Checkbox list results (comma separated or JSON)
    relevantConditions: z.string().optional(),

    // Declaration
    healthDeclaration: z.literal("on", {
        errorMap: () => ({ message: "Debes aceptar la declaración jurada" }),
    }),
})

export async function saveHealthProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'No autorizado' }
    }

    // Helper to get yes/no + details
    const getBool = (key: string) => formData.get(key) as "yes" | "no"
    // Helper to get string, converting null/empty to undefined for optional fields, or keep as is for required
    const getStr = (key: string) => {
        const val = formData.get(key)
        return val ? val.toString() : undefined
    }

    // Collect Checkbox values
    const conditions = [
        formData.get('condition_diabetes') === 'on' ? 'Diabetes' : null,
        formData.get('condition_asthma') === 'on' ? 'Asma Bronquial' : null,
        formData.get('condition_hypertension') === 'on' ? 'Hipertensión Arterial' : null,
        formData.get('condition_cardiac') === 'on' ? 'Problemas Cardíacos' : null,
        formData.get('condition_seizures') === 'on' ? 'Convulsiones' : null,
    ].filter(Boolean).join(', ')

    const rawData = {
        dni: getStr('dni'),
        phone: getStr('phone'),
        address: getStr('address'),
        emergencyPhone: getStr('emergencyPhone'),
        dateOfBirth: getStr('dateOfBirth'),
        activityType: getStr('activityType'),
        weight: getStr('weight'),
        height: getStr('height'),
        goals: getStr('goals'),
        healthDeclaration: getStr('healthDeclaration'),

        hasChronicDisease: getBool('hasChronicDisease'),
        chronicDiseaseDetails: getStr('chronicDiseaseDetails'),
        hasAllergies: getBool('hasAllergies'),
        allergiesDetails: getStr('allergiesDetails'),
        isUnderTreatment: getBool('isUnderTreatment'),
        treatmentDetails: getStr('treatmentDetails'),
        takesMedication: getBool('takesMedication'),
        medicationDetails: getStr('medicationDetails'),
        hadSurgery: getBool('hadSurgery'),
        surgeryDetails: getStr('surgeryDetails'),
        hasPhysicalLimitation: getBool('hasPhysicalLimitation'),
        limitationDetails: getStr('limitationDetails'),

        relevantConditions: conditions
    }

    const validatedFields = OnboardingSchema.safeParse(rawData)

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten())
        const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('. ')
        return { error: 'Faltan campos obligatorios: ' + errorMessages }
    }

    const data = validatedFields.data

    // 1. Update Profile (Personal Data)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            dni: data.dni,
            phone: data.phone,
            address: data.address,
            emergency_phone: data.emergencyPhone,
            date_of_birth: data.dateOfBirth,
            activity_type: data.activityType,
            health_declaration_date: new Date().toISOString(),
            has_accepted_terms: true
        })
        .eq('id', user.id)

    if (profileError) {
        return { error: 'Error al actualizar perfil: ' + profileError.message }
    }

    // 2. Insert/Update Health Sheet
    // We map the "Details" inputs to the legacy columns where appropriate, or verify if we need new columns for details.
    // The schema update added booleans. Current `health_sheets` has `injuries`, `allergies`, `medical_conditions`, `goals`.
    // Strategy: 
    // - `medical_conditions`: Combine Chronic Disease + details.
    // - `allergies`: Combine Allergy boolean + details.
    // - `injuries`: Combine Limitation + Surgery + details? Or keep broadly.
    // Actually, schema update added `has_chronic_disease`, etc. But not `_details` column. 
    // I should probably append details to the existing text columns OR store them in the text columns.
    // Let's store the specific details in the specific text columns if they exist, or concat them into `medical_conditions` / `injuries` if not.
    // User asked "La parte de ficha de salad deberia ser reemplazada".

    // Let's save the BOOLEANS to the new columns.
    // And save the DETAILS text to `medical_conditions`, `allergies`, `injuries` (repurposed or combined).

    const combinedMedicalConditions = [
        data.hasChronicDisease === 'yes' ? `Enfermedad: ${data.chronicDiseaseDetails}` : null,
        data.isUnderTreatment === 'yes' ? `Tratamiento: ${data.treatmentDetails}` : null,
        data.takesMedication === 'yes' ? `Medicación: ${data.medicationDetails}` : null,
        data.relevantConditions ? `Antecedentes: ${data.relevantConditions}` : null
    ].filter(Boolean).join('. ')

    const combinedInjuries = [
        data.hadSurgery === 'yes' ? `Cirugías: ${data.surgeryDetails}` : null,
        data.hasPhysicalLimitation === 'yes' ? `Limitaciones: ${data.limitationDetails}` : null
    ].filter(Boolean).join('. ')

    const combinedAllergies = data.hasAllergies === 'yes' ? data.allergiesDetails : 'No manifiesta'

    const { error: healthError } = await supabase.from('health_sheets').insert({
        user_id: user.id,
        weight: parseFloat(data.weight),
        height: parseFloat(data.height),
        goals: data.goals,

        // Mapped legacy text fields
        medical_conditions: combinedMedicalConditions,
        injuries: combinedInjuries,
        allergies: combinedAllergies,

        // New Boolean Fields
        has_chronic_disease: data.hasChronicDisease === 'yes',
        has_allergies_bool: data.hasAllergies === 'yes',
        is_under_treatment: data.isUnderTreatment === 'yes',
        takes_medication: data.takesMedication === 'yes',
        had_surgery: data.hadSurgery === 'yes',
        has_physical_limitation: data.hasPhysicalLimitation === 'yes',
        relevant_conditions: data.relevantConditions,
    })

    if (healthError) {
        console.error('Error saving health profile:', healthError)
        return { error: 'Error al guardar ficha médica.' + healthError.message }
    }

    redirect('/dashboard')
}
