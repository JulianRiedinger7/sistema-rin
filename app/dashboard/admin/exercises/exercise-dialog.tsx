'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { createExercise, updateExercise } from './actions'
import { Loader2, Plus } from 'lucide-react'

// Using standard alert for simplicity unless user asks for toaster
// Actually, let's keep it simple with state messages

interface Exercise {
    id: string
    name: string
    video_url?: string | null
    muscle_group?: string | null
    category: 'Fuerza' | 'Potencia' | 'Aerobico' | 'Pilates' | 'Movilidad'
}

interface ExerciseDialogProps {
    exercise?: Exercise
    children?: React.ReactNode
    mode?: 'create' | 'edit'
}

export function ExerciseDialog({ exercise, children, mode = 'create' }: ExerciseDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const uploadVideo = async (file: File) => {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('exercises')
            .upload(filePath, file)

        if (uploadError) {
            throw new Error('Error al subir video: ' + uploadError.message)
        }

        const { data: { publicUrl } } = supabase.storage
            .from('exercises')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)

        try {
            const videoFile = formData.get('video_file') as File
            // Check if it's a real file (not string 'undefined' or empty)
            if (videoFile && videoFile.size > 0 && videoFile.name !== 'undefined') {
                setUploading(true)
                const publicUrl = await uploadVideo(videoFile)
                setUploading(false)

                // Append the URL to formData and remove the file to avoid sending it to server
                formData.set('video_url', publicUrl)
                formData.delete('video_file')
            }

            // If using the URL tab, video_url is already in formData from the input

            let result
            if (mode === 'edit' && exercise) {
                result = await updateExercise(exercise.id, formData)
            } else {
                result = await createExercise(formData)
            }

            if (result?.error) {
                setError(result.error)
            } else {
                setOpen(false)
            }
        } catch (err: any) {
            setError(err.message || 'Error desconocido')
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Ejercicio</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Crear Ejercicio' : 'Editar Ejercicio'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Añade un nuevo ejercicio a la biblioteca.' : 'Modifica los detalles del ejercicio.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={exercise?.name}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Categoría
                        </Label>
                        <div className="col-span-3">
                            <Select name="category" defaultValue={exercise?.category || 'Fuerza'} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fuerza">Fuerza</SelectItem>
                                    <SelectItem value="Potencia">Potencia</SelectItem>
                                    <SelectItem value="Aerobico">Aeróbico</SelectItem>
                                    <SelectItem value="Pilates">Pilates</SelectItem>
                                    <SelectItem value="Movilidad">Movilidad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="muscle_group" className="text-right">
                            Músculo
                        </Label>
                        <Input
                            id="muscle_group"
                            name="muscle_group"
                            defaultValue={exercise?.muscle_group || ''}
                            className="col-span-3"
                            placeholder="Ej: Pectoral, Cuádriceps"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">
                            Video
                        </Label>
                        <div className="col-span-3 space-y-3">
                            <Tabs defaultValue={exercise?.video_url ? 'url' : 'upload'} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="url">Link Youtube/URL</TabsTrigger>
                                    <TabsTrigger value="upload">Subir Video</TabsTrigger>
                                </TabsList>
                                <TabsContent value="url">
                                    <Input
                                        id="video_url"
                                        name="video_url"
                                        defaultValue={exercise?.video_url || ''}
                                        placeholder="https://youtube.com/..."
                                    />
                                </TabsContent>
                                <TabsContent value="upload">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Input id="video_file" type="file" name="video_file" accept="video/*" />
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Formatos permitidos: MP4, WebM. Máx 50MB.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive text-center">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={loading || uploading}>
                            {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {uploading ? 'Subiendo Video...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
