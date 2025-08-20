"use client";

import { useState } from 'react';
import type { Figure } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap, UserCircle, Briefcase, Globe, Users, Edit, Save, X, Loader2, ImageOff, Instagram, Twitter, Youtube, Facebook
} from "lucide-react";
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateFigureInFirestore } from '@/lib/placeholder-data';
import { correctMalformedUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { Separator } from '../ui/separator';

interface FigureInfoProps {
  figure: Figure;
  currentUser: User | null; 
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground text-sm">{value}</p>
      </div>
    </div>
  );
};

const SocialLink: React.FC<{ href?: string; icon: React.ElementType; label: string }> = ({ href, icon: Icon, label }) => {
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
      <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-muted/50 hover:border-primary">
          <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs">{label}</span>
    </a>
  );
};

export function FigureInfo({ figure, currentUser }: FigureInfoProps) {
  const { user: firestoreUser, isAnonymous } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(figure.photoUrl || '');
  const [socialLinks, setSocialLinks] = useState(figure.socialLinks || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const correctedUrl = correctMalformedUrl(photoUrl);
      await updateFigureInFirestore({ 
        id: figure.id, 
        photoUrl: correctedUrl,
        socialLinks: socialLinks
      });
      toast({
        title: "Perfil Actualizado",
        description: `La información de ${figure.name} ha sido actualizada.`,
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating figure info:", error);
      toast({
        title: "Error al Guardar",
        description: error.message || "No se pudo actualizar la información.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSocialLinkChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  const hasBasicInfo = figure.occupation || figure.nationality || figure.gender || figure.category;
  const hasDetailedInfo =
    figure.alias ||
    figure.species ||
    figure.firstAppearance ||
    figure.birthDateOrAge ||
    figure.birthPlace ||
    figure.statusLiveOrDead ||
    figure.maritalStatus;
  const hasPhysicalInfo =
    figure.height ||
    figure.weight ||
    figure.hairColor ||
    figure.eyeColor ||
    figure.distinctiveFeatures;
  const hasSocialLinks = Object.values(figure.socialLinks || {}).some(link => !!link);

  const hasAnyInfo = hasBasicInfo || hasDetailedInfo || hasPhysicalInfo || hasSocialLinks;

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Información Detallada</CardTitle>
          <CardDescription>
            Datos biográficos y descriptivos de {figure.name}.
          </CardDescription>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-6 p-4 border-dashed border rounded-md">
            <div>
              <h3 className="font-semibold mb-2">Editar Imagen de Perfil</h3>
              <Label htmlFor="photoUrl">URL de la Imagen de Perfil</Label>
              <Input 
                id="photoUrl" 
                value={photoUrl} 
                onChange={(e) => setPhotoUrl(e.target.value)} 
                placeholder="https://..."
              />
               <p className="text-xs text-muted-foreground mt-1">Pega un enlace de Wikimedia, Pinterest, etc.</p>
            </div>

            {photoUrl && (
              <div className="mt-2">
                <Label>Vista Previa</Label>
                <div className="mt-1 w-28 h-42 rounded-md border p-1 bg-muted overflow-hidden flex items-center justify-center">
                  <Image
                    key={photoUrl}
                    src={correctMalformedUrl(photoUrl)}
                    alt="Vista previa"
                    width={100}
                    height={150}
                    className="object-cover w-full h-full"
                    data-ai-hint="image preview"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/100x150.png";
                      e.currentTarget.srcset = "";
                    }}
                  />
                </div>
              </div>
            )}
            
            <Separator />

            <div>
               <h3 className="font-semibold mb-2">Editar Redes Sociales</h3>
               <div className="space-y-3">
                 <div><Label htmlFor="instagram">Instagram</Label><Input id="instagram" value={socialLinks.instagram || ''} onChange={(e) => handleSocialLinkChange('instagram', e.target.value)} placeholder="https://instagram.com/..." /></div>
                 <div><Label htmlFor="twitter">X (Twitter)</Label><Input id="twitter" value={socialLinks.twitter || ''} onChange={(e) => handleSocialLinkChange('twitter', e.target.value)} placeholder="https://x.com/..." /></div>
                 <div><Label htmlFor="youtube">YouTube</Label><Input id="youtube" value={socialLinks.youtube || ''} onChange={(e) => handleSocialLinkChange('youtube', e.target.value)} placeholder="https://youtube.com/..." /></div>
                 <div><Label htmlFor="facebook">Facebook</Label><Input id="facebook" value={socialLinks.facebook || ''} onChange={(e) => handleSocialLinkChange('facebook', e.target.value)} placeholder="https://facebook.com/..." /></div>
               </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </div>
        ) : !hasAnyInfo ? (
           <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">No hay información detallada disponible para esta figura.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {hasBasicInfo && (
                  <div className="space-y-4">
                      <h3 className="font-headline text-lg">Básica</h3>
                      <InfoItem icon={Briefcase} label="Ocupación" value={figure.occupation} />
                      <InfoItem icon={Globe} label="Nacionalidad" value={figure.nationality} />
                      <InfoItem icon={Users} label="Género" value={figure.gender} />
                      <InfoItem icon={BookOpen} label="Categoría" value={figure.category} />
                  </div>
                )}
                {hasDetailedInfo && (
                  <div className="space-y-4">
                      <h3 className="font-headline text-lg">General</h3>
                      <InfoItem icon={NotepadText} label="Alias" value={figure.alias} />
                      <InfoItem icon={Zap} label="Especie" value={figure.species} />
                      <InfoItem icon={BookOpen} label="Primera Aparición" value={figure.firstAppearance} />
                      <InfoItem icon={Cake} label="Edad / Nacimiento" value={figure.birthDateOrAge} />
                      <InfoItem icon={MapPin} label="Lugar de Nacimiento" value={figure.birthPlace} />
                      <InfoItem icon={Activity} label="Estado" value={figure.statusLiveOrDead} />
                      <InfoItem icon={HeartHandshake} label="Estado Civil" value={figure.maritalStatus} />
                  </div>
                )}
                {hasPhysicalInfo && (
                   <div className="space-y-4">
                      <h3 className="font-headline text-lg">Físico</h3>
                      <InfoItem icon={StretchVertical} label="Altura" value={figure.height} />
                      <InfoItem icon={Scale} label="Peso" value={figure.weight} />
                      <InfoItem icon={Palette} label="Color de Cabello" value={figure.hairColor} />
                      <InfoItem icon={Eye} label="Color de Ojos" value={figure.eyeColor} />
                      <InfoItem icon={Scan} label="Rasgos Distintivos" value={figure.distinctiveFeatures} />
                  </div>
                )}
            </div>
            {hasSocialLinks && (
              <>
                <Separator/>
                <div>
                   <h3 className="font-headline text-lg mb-4">Redes Sociales</h3>
                   <div className="flex items-center gap-6">
                      <SocialLink href={figure.socialLinks?.instagram} icon={Instagram} label="Instagram" />
                      <SocialLink href={figure.socialLinks?.twitter} icon={Twitter} label="X (Twitter)" />
                      <SocialLink href={figure.socialLinks?.youtube} icon={Youtube} label="YouTube" />
                      <SocialLink href={figure.socialLinks?.facebook} icon={Facebook} label="Facebook" />
                   </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
