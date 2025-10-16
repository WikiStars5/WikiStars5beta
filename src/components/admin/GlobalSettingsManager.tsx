
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings } from 'lucide-react';
import { getGlobalSettings, updateGlobalSettings } from '@/lib/placeholder-data';
import type { GlobalSettings } from '@/lib/types';

const DEFAULT_HEIGHT = 450;

export function GlobalSettingsManager() {
    const [settings, setSettings] = React.useState<GlobalSettings>({ instagramEmbedHeight: DEFAULT_HEIGHT });
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const fetchedSettings = await getGlobalSettings();
                setSettings({
                    instagramEmbedHeight: fetchedSettings?.instagramEmbedHeight ?? DEFAULT_HEIGHT,
                });
            } catch (error) {
                console.error("Error fetching global settings:", error);
                toast({
                    title: "Error al Cargar Ajustes",
                    description: "No se pudieron cargar los ajustes globales.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);

    const handleHeightChange = (value: number[]) => {
        setSettings(prev => ({ ...prev, instagramEmbedHeight: value[0] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateGlobalSettings(settings);
            toast({
                title: "Ajustes Guardados",
                description: "Los ajustes globales han sido actualizados.",
            });
        } catch (error: any) {
             toast({
                title: "Error al Guardar",
                description: `No se pudieron guardar los ajustes. ${error.message}`,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Settings />
                    Ajustes Globales de Contenido
                </CardTitle>
                <CardDescription>
                    Controla la apariencia del contenido multimedia en todo el sitio.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="ig-height-slider">
                                Altura de Fotos de Instagram (Grid): {settings.instagramEmbedHeight}px
                            </Label>
                            <Slider
                                id="ig-height-slider"
                                min={300}
                                max={800}
                                step={10}
                                value={[settings.instagramEmbedHeight ?? DEFAULT_HEIGHT]}
                                onValueChange={handleHeightChange}
                                disabled={isSaving}
                            />
                             <p className="text-xs text-muted-foreground mt-2">
                                Ajusta la altura del contenedor para las fotos en la vista de cuadrícula. Un valor más bajo "recorta" más la imagen.
                            </p>
                        </div>
                         <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Guardando...' : 'Guardar Ajustes'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
