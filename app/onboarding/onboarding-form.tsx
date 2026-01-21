'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { saveHealthProfile } from './actions'
import { useState } from 'react'
import { Loader2, User, Activity, HeartPulse, FileText, Scale, Ruler, Home, Phone } from 'lucide-react'

export function OnboardingForm({ initialDni, prices }: { initialDni: string, prices: any[] }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Helper to get formatted price
    const getPriceText = (type: string) => {
        const p = prices?.find(p => p.activity_type === type)
        return p ? `$${p.price.toLocaleString('es-AR')}` : '-'
    }

    // State for conditional inputs...
    /* unchanged state hooks */
    const [hasChronicDisease, setHasChronicDisease] = useState("no")
    const [hasAllergies, setHasAllergies] = useState("no")
    const [isUnderTreatment, setIsUnderTreatment] = useState("no")
    const [takesMedication, setTakesMedication] = useState("no")
    const [hadSurgery, setHadSurgery] = useState("no")
    const [hasPhysicalLimitation, setHasPhysicalLimitation] = useState("no")

    /* ... inside return ... */
    /*
                                        <Label htmlFor="activityType">Actividad Contratada</Label>
                                        <Select name="activityType" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gym">Gimnasio ({getPriceText('gym')})</SelectItem>
                                                <SelectItem value="pilates">Pilates ({getPriceText('pilates')})</SelectItem>
                                                <SelectItem value="mixed">Mixto ({getPriceText('mixed')})</SelectItem>
                                            </SelectContent>
                                        </Select>
    */

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)
        const result = await saveHealthProfile(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black/95 flex items-center justify-center p-4 py-10">
            <Card className="w-full max-w-3xl border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary">Configuración de Perfil</CardTitle>
                    <CardDescription>
                        Completa tu información personal y ficha médica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-8">

                        {/* 1. Datos Personales */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/90">
                                <User className="h-5 w-5 text-primary" /> Datos Personales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dni">DNI</Label>
                                    <Input
                                        id="dni"
                                        name="dni"
                                        defaultValue={initialDni}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" name="phone" placeholder="+54 9 11..." required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergencyPhone">Teléfono de Emergencias</Label>
                                    <Input id="emergencyPhone" name="emergencyPhone" placeholder="Nombre y Teléfono" required />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Domicilio</Label>
                                    <Input id="address" name="address" placeholder="Calle, Altura, Localidad" required />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="activityType">Actividad Contratada</Label>
                                    <Select name="activityType" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gym">Gimnasio ({getPriceText('gym')})</SelectItem>
                                            <SelectItem value="pilates">Pilates ({getPriceText('pilates')})</SelectItem>
                                            <SelectItem value="mixed">Mixto ({getPriceText('mixed')})</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Métricas Físicas */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/90">
                                <Scale className="h-5 w-5 text-primary" /> Métricas Físicas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Peso (kg)</Label>
                                    <div className="relative">
                                        <Input id="weight" name="weight" type="number" step="0.1" placeholder="Ej: 75.5" className="pl-9" required />
                                        <Scale className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Altura (cm)</Label>
                                    <div className="relative">
                                        <Input id="height" name="height" type="number" placeholder="Ej: 175" className="pl-9" required />
                                        <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Ficha de Salud (Cuestionario) */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/90 border-b border-border pb-2">
                                <HeartPulse className="h-5 w-5 text-primary" /> Información de Salud
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="goals">Objetivos Principales</Label>
                                <Textarea id="goals" name="goals" placeholder="Ganar fuerza, mejorar postura..." required />
                            </div>

                            {/* Question 1 */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Tiene alguna enfermedad que necesite tratamiento médico o controles periódicos?</Label>
                                <RadioGroup name="hasChronicDisease" value={hasChronicDisease} onValueChange={setHasChronicDisease} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="chron-yes" /><Label htmlFor="chron-yes">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="chron-no" /><Label htmlFor="chron-no">NO</Label></div>
                                </RadioGroup>
                                {hasChronicDisease === 'yes' && (
                                    <Input name="chronicDiseaseDetails" placeholder="Especifique cuál..." className="mt-2" required />
                                )}
                            </div>

                            {/* Question 2 */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Padece algún tipo de alergia?</Label>
                                <RadioGroup name="hasAllergies" value={hasAllergies} onValueChange={setHasAllergies} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="alg-yes" /><Label htmlFor="alg-yes">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="alg-no" /><Label htmlFor="alg-no">NO</Label></div>
                                </RadioGroup>
                                {hasAllergies === 'yes' && (
                                    <Input name="allergiesDetails" placeholder="Especifique a qué..." className="mt-2" required />
                                )}
                            </div>

                            {/* Question 3 */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Recibe tratamiento actualmente?</Label>
                                <RadioGroup name="isUnderTreatment" value={isUnderTreatment} onValueChange={setIsUnderTreatment} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="treat-yes" /><Label htmlFor="treat-yes">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="treat-no" /><Label htmlFor="treat-no">NO</Label></div>
                                </RadioGroup>
                                {isUnderTreatment === 'yes' && (
                                    <Input name="treatmentDetails" placeholder="Especifique..." className="mt-2" required />
                                )}
                            </div>

                            {/* Question 4 */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Recibe alguna medicación en forma habitual?</Label>
                                <RadioGroup name="takesMedication" value={takesMedication} onValueChange={setTakesMedication} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="med-yes" /><Label htmlFor="med-yes">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="med-no" /><Label htmlFor="med-no">NO</Label></div>
                                </RadioGroup>
                                {takesMedication === 'yes' && (
                                    <Input name="medicationDetails" placeholder="Especifique cuál..." className="mt-2" required />
                                )}
                            </div>

                            {/* Question 5 */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Fue operado alguna vez?</Label>
                                <RadioGroup name="hadSurgery" value={hadSurgery} onValueChange={setHadSurgery} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="surg-yes" /><Label htmlFor="surg-yes">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="surg-no" /><Label htmlFor="surg-no">NO</Label></div>
                                </RadioGroup>
                                {hadSurgery === 'yes' && (
                                    <Input name="surgeryDetails" placeholder="Especifique qué y cuándo..." className="mt-2" required />
                                )}
                            </div>

                            {/* Question 6 */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Presenta limitación o impedimento para realizar actividad física?</Label>
                                <RadioGroup name="hasPhysicalLimitation" value={hasPhysicalLimitation} onValueChange={setHasPhysicalLimitation} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="lim-yes" /><Label htmlFor="lim-yes">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="lim-no" /><Label htmlFor="lim-no">NO</Label></div>
                                </RadioGroup>
                                {hasPhysicalLimitation === 'yes' && (
                                    <Input name="limitationDetails" placeholder="Especifique..." className="mt-2" required />
                                )}
                            </div>

                            {/* Antecedentes Checkboxes */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/50">
                                <Label className="text-base">¿Tiene antecedentes de...?</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="condition-diabetes" name="condition_diabetes" />
                                        <Label htmlFor="condition-diabetes">Diabetes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="condition-asthma" name="condition_asthma" />
                                        <Label htmlFor="condition-asthma">Asma Bronquial</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="condition-hypertension" name="condition_hypertension" />
                                        <Label htmlFor="condition-hypertension">Hipertensión Arterial</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="condition-cardiac" name="condition_cardiac" />
                                        <Label htmlFor="condition-cardiac">Problemas Cardíacos</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="condition-seizures" name="condition_seizures" />
                                        <Label htmlFor="condition-seizures">Convulsiones</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Declaración Jurada */}
                        <div className="space-y-4 pt-4 border-t border-primary/10">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-red-500">
                                <FileText className="h-5 w-5" /> Declaración Jurada
                            </h3>
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-muted-foreground space-y-2">
                                <p>
                                    Declaro bajo juramento que los datos proporcionados son reales y que me encuentro en condiciones físicas aptas para realizar actividad física.
                                    Eximo al establecimiento de responsabilidad por cualquier lesión derivada de condiciones preexistentes no declaradas.
                                </p>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="healthDeclaration" name="healthDeclaration" required />
                                    <Label htmlFor="healthDeclaration" className="font-medium text-foreground">
                                        Acepto los términos de esta declaración jurada.
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Guardar Perfil
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
