import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Activity, HeartPulse, FileText, Calendar, Phone, CreditCard, ArrowLeft, Scale, Ruler, TrendingUp, Home, AlertCircle, Pill, Stethoscope, Scissors, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditStudentDialog } from './edit-student-dialog'

export default async function AdminStudentProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
    }

    if (!profile) return notFound()

    // Fetch Health Sheet
    const { data: healthSheet } = await supabase
        .from('health_sheets')
        .select('*')
        .eq('user_id', id)
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
    }

    const renderBooleanAnswer = (label: string, value: boolean, details?: string, icon?: any) => {
        const Icon = icon || AlertCircle
        return (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${value ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/5 border-border/50'}`}>
                <div className={`p-2 rounded-full ${value ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-none mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant={value ? "destructive" : "outline"} className={!value ? "text-muted-foreground" : ""}>
                            {value ? 'SI' : 'NO'}
                        </Badge>
                        {value && details && (
                            <span className="text-sm font-medium text-foreground">{details}</span>
                        )}
                        {value && !details && (
                            <span className="text-sm font-medium text-foreground"></span>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/admin/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold text-primary">Perfil del Alumno</h1>
                </div>
                <div className="flex gap-2">
                    <EditStudentDialog student={profile} />
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href={`/dashboard/admin/users/${id}/progress`}>
                            <TrendingUp className="h-4 w-4" />
                            Ver Progreso
                        </Link>
                    </Button>
                </div>
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
                        <div className="flex gap-2">
                            <Badge variant="outline" className="uppercase text-primary border-primary">
                                {profile.role}
                            </Badge>
                            {profile.health_declaration_date ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Firmado</Badge>
                            ) : (
                                <Badge variant="destructive">T&C Pendiente</Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <AlertTriangle className="h-4 w-4" /> Emergencia
                        </p>
                        <p className="text-lg">{profile.emergency_phone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Home className="h-4 w-4" /> Domicilio
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

                    {/* Metrics Section */}
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

                    {/* Questionnaire Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderBooleanAnswer("Enfermedad Crónica / Tratamiento", healthSheet?.has_chronic_disease, "", Stethoscope)}
                        {renderBooleanAnswer("Alergias", healthSheet?.has_allergies_bool, "", AlertTriangle)}
                        {renderBooleanAnswer("En Tratamiento", healthSheet?.is_under_treatment, "", Pill)}
                        {renderBooleanAnswer("Medicacion Habitual", healthSheet?.takes_medication, "", Pill)}
                        {renderBooleanAnswer("Antecedentes Quirúrgicos", healthSheet?.had_surgery, "", Scissors)}
                        {renderBooleanAnswer("Limitaciones Físicas", healthSheet?.has_physical_limitation, "", AlertCircle)}
                    </div>

                    {/* Consolidate Details View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                        {healthSheet?.medical_conditions && (
                            <div className="col-span-1 md:col-span-2">
                                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4" /> Detalle Clínico y Antecedentes
                                </h4>
                                <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-md border border-border/30">
                                    {healthSheet.medical_conditions}
                                </p>
                            </div>
                        )}

                        {(healthSheet?.injuries || healthSheet?.allergies) && (
                            <>
                                <div>
                                    <h4 className="font-semibold text-primary mb-2">Lesiones / Cirugías (Detalle)</h4>
                                    <p className="text-sm text-muted-foreground">{healthSheet?.injuries || 'Ninguna descrita'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary mb-2">Alergias (Detalle)</h4>
                                    <p className="text-sm text-muted-foreground">{healthSheet?.allergies || 'Ninguna descrita'}</p>
                                </div>
                            </>
                        )}
                        {healthSheet?.relevant_conditions && (
                            <div className="col-span-1 md:col-span-2">
                                <h4 className="font-semibold text-primary mb-2">Condiciones Relevantes (Checkbox)</h4>
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
