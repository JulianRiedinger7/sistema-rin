import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Activity, HeartPulse, FileText, Calendar, Phone, CreditCard, Scale, Ruler } from 'lucide-react'
import { EditProfileDialog } from './edit-profile-dialog'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
    }

    const { data: healthSheet } = await supabase
        .from('health_sheets')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A'
        const birthDate = new Date(dob)
        const diff = Date.now() - birthDate.getTime()
        const ageDate = new Date(diff)
        return Math.abs(ageDate.getUTCFullYear() - 1970)
    }

    const getActivityLabel = (type: string) => {
        switch (type) {
            case 'gym': return 'Gimnasio'
            case 'pilates': return 'Pilates'
            case 'mixed': return 'Mixto'
            default: return type || '-'
        }
    }

    const { data: prices } = await supabase
        .from('activity_prices')
        .select('*')

    const getActivityPrice = (type: string) => {
        const priceObj = prices?.find(p => p.activity_type === type)
        const price = priceObj?.price || 0
        return price ? `$${price.toLocaleString('es-AR')}` : '-'
        // Fallback or loading state logic if needed
    }

    const renderBooleanAnswer = (label: string, value: boolean, details?: string) => {
        return (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${value ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/5 border-border/50'}`}>
                <div className={`p-2 rounded-full ${value ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-none mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant={value ? "destructive" : "outline"} className={!value ? "text-muted-foreground" : ""}>
                            {value ? 'SI' : 'NO'}
                        </Badge>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">Mi Perfil</h1>
                <EditProfileDialog profile={profile} healthSheet={healthSheet} />
            </div>

            {/* Personal Info Card */}
            <Card>
                <CardHeader className="pb-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {profile.full_name}
                            </CardTitle>
                            <CardDescription>{profile.email}</CardDescription>
                        </div>
                        <Badge variant="outline" className="uppercase text-primary border-primary">
                            {profile.role}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> DNI
                        </p>
                        <p className="text-lg">{profile.dni || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Teléfono
                        </p>
                        <p className="text-lg">{profile.phone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Emergencia
                        </p>
                        <p className="text-lg">{profile.emergency_phone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Domicilio
                        </p>
                        <p className="text-lg">{profile.address || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Fecha de Nacimiento
                        </p>
                        <p className="text-lg">
                            {formatDate(profile.date_of_birth)}
                            <span className="text-sm text-muted-foreground ml-2">
                                ({calculateAge(profile.date_of_birth)} años)
                            </span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Actividad
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-lg capitalize">{getActivityLabel(profile.activity_type)}</p>
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Cuota: {getActivityPrice(profile.activity_type)}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Health Info Card */}
            <Card>
                <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <HeartPulse className="h-5 w-5 text-red-500" />
                        Ficha Médica y Métricas
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">

                    {/* Updated Metrics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/10 p-4 rounded-lg border border-border flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Scale className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Peso Corporal</p>
                                <p className="text-2xl font-bold">{healthSheet?.weight || '-'} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                            </div>
                        </div>
                        <div className="bg-muted/10 p-4 rounded-lg border border-border flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Ruler className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Altura</p>
                                <p className="text-2xl font-bold">{healthSheet?.height || '-'} <span className="text-sm font-normal text-muted-foreground">cm</span></p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-primary mb-2">Objetivos</h4>
                        <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md border border-border/50">
                            {healthSheet?.goals || 'No especificado'}
                        </p>
                    </div>

                    {/* New Questionnaire Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderBooleanAnswer("Enfermedad Crónica", healthSheet?.has_chronic_disease)}
                        {renderBooleanAnswer("Alergias", healthSheet?.has_allergies_bool)}
                        {renderBooleanAnswer("En Tratamiento", healthSheet?.is_under_treatment)}
                        {renderBooleanAnswer("Medicacion Habitual", healthSheet?.takes_medication)}
                        {renderBooleanAnswer("Antecedentes Quirúrgicos", healthSheet?.had_surgery)}
                        {renderBooleanAnswer("Limitaciones Físicas", healthSheet?.has_physical_limitation)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                        {healthSheet?.medical_conditions && (
                            <div className="col-span-1 md:col-span-2">
                                <h4 className="font-semibold text-primary mb-2">Detalle Clínico</h4>
                                <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-md border border-border/30">
                                    {healthSheet.medical_conditions}
                                </p>
                            </div>
                        )}

                        {(healthSheet?.injuries || healthSheet?.allergies) && (
                            <>
                                <div>
                                    <h4 className="font-semibold text-primary mb-2">Lesiones / Cirugías</h4>
                                    <p className="text-sm text-muted-foreground">{healthSheet?.injuries || 'Ninguna descrita'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary mb-2">Alergias</h4>
                                    <p className="text-sm text-muted-foreground">{healthSheet?.allergies || 'Ninguna descrita'}</p>
                                </div>
                            </>
                        )}
                        {healthSheet?.relevant_conditions && (
                            <div className="col-span-1 md:col-span-2">
                                <h4 className="font-semibold text-primary mb-2">Condiciones Relevantes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {healthSheet.relevant_conditions.split(', ').map((cond: string, i: number) => (
                                        <Badge key={i} variant="secondary">{cond}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {profile.health_declaration_date && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-green-500 bg-green-500/10 p-2 rounded w-fit">
                            <FileText className="h-3 w-3" />
                            Declaración Jurada aceptada el {new Date(profile.health_declaration_date).toLocaleDateString()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
