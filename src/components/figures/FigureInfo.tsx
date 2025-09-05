
"use client";

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { Figure } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap, UserCircle, Briefcase, Globe, Users, Edit, Save, X, Loader2, ImageOff
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateFigureInFirestore } from '@/lib/placeholder-data';
import { cn, correctMalformedUrl } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { CountryCombobox } from '../shared/CountryCombobox';
import { countryCodeToNameMap } from '@/config/countries';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '../shared/DatePicker';
import { FigureTags } from './FigureTags';
import { Badge } from '../ui/badge';
import { TAG_OPTIONS } from '@/config/tags';
import { Combobox } from '../shared/Combobox';
import { Slider } from '../ui/slider';

interface FigureInfoProps {
  figure: Figure;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  imageUrl?: string | null;
}

const MARITAL_STATUS_OPTIONS = [
    { value: 'Soltero/a', label: 'Soltero/a' },
    { value: 'Casado/a', label: 'Casado/a' },
    { value: 'Viudo/a', label: 'Viudo/a' },
    { value: 'Divorciado/a', label: 'Divorciado/a' },
    { value: 'Separado/a legalmente', label: 'Separado/a legalmente' },
    { value: 'Conviviente / En unión de hecho', label: 'Conviviente / En unión de hecho' },
];

const SOCIAL_MEDIA_CONFIG = {
  instagram: { label: 'Instagram', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Finstagram.png?alt=media&token=91707034-56b6-411f-9504-9273dd0f8b64' },
  twitter: { label: 'X (Twitter)', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ftwitter.webp?alt=media&token=492950d1-1987-48f0-a149-02290cfa1ffc' },
  youtube: { label: 'YouTube', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fyoutube.png?alt=media&token=8952da33-736f-4718-b6d9-fcc99dd93111' },
  facebook: { label: 'Facebook', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ffacebook.png?alt=media&token=100d82e3-e8fe-4f84-96a2-79a23fed43b4' },
  tiktok: { label: 'TikTok', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ftiktok.png?alt=media&token=87f84943-a74c-4916-9a2c-c4a2b3451cbc' },
  linkedin: { label: 'LinkedIn', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flinkedin.png?alt=media&token=cdc7c2b8-e71a-47de-b261-b44b96f5bf0a' },
  discord: { label: 'Discord', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fdiscord.png?alt=media&token=dbb8b8d1-c5d8-4673-b91f-25b1d796195c' },
};


const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, imageUrl }) => {
  if (!value && !imageUrl) return null;

  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={typeof value === 'string' ? value : label}
              width={20}
              height={15}
              className="w-5 h-auto flex-shrink-0"
            />
          )}
          {typeof value === 'string' ? (
             <p className="text-muted-foreground text-sm">{value}</p>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
};

const SocialLink: React.FC<{ href?: string; imageUrl: string; label: string }> = ({ href, imageUrl, label }) => {
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
      <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-muted/50 hover:border-primary p-2">
          <Image src={imageUrl} alt={label} width={32} height={32} className="object-contain" />
      </div>
      <span className="text-xs">{label}</span>
    </a>
  );
};

type SocialLinkErrors = {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  discord?: string;
};

export function FigureInfo({ figure }: FigureInfoProps) {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  
  // State for editable fields
  const [name, setName] = useState(figure.name || '');
  const [nationalityCode, setNationalityCode] = useState(figure.nationalityCode || '');
  const [gender, setGender] = useState(figure.gender || '');
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    figure.birthDateOrAge && !isNaN(new Date(figure.birthDateOrAge).getTime()) 
      ? new Date(figure.birthDateOrAge) 
      : undefined
  );
  const [maritalStatus, setMaritalStatus] = useState(figure.maritalStatus || '');
  const [heightCm, setHeightCm] = useState<number>(figure.heightCm || 150);
  const [photoUrl, setPhotoUrl] = useState(figure.photoUrl || '');
  const [socialLinks, setSocialLinks] = useState(figure.socialLinks || {});
  const [tags, setTags] = useState(figure.tags || []);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [linkErrors, setLinkErrors] = useState<SocialLinkErrors>({});
  
  // Per user request, the edit button should always be available.
  const canEdit = true;

  // When editing starts, populate fields with current figure data
  useEffect(() => {
    if (isEditing) {
      setName(figure.name || '');
      setNationalityCode(figure.nationalityCode || '');
      setGender(figure.gender || '');
      setBirthDate(
        figure.birthDateOrAge && !isNaN(new Date(figure.birthDateOrAge).getTime())
          ? new Date(figure.birthDateOrAge)
          : undefined
      );
      setMaritalStatus(figure.maritalStatus || '');
      setHeightCm(figure.heightCm || 150);
      setPhotoUrl(figure.photoUrl || '');
      setSocialLinks(figure.socialLinks || {});
      setTags(figure.tags || []);
      setSelectedTag(null);
    }
  }, [isEditing, figure]);

  const validateLinks = () => {
    const errors: SocialLinkErrors = {};
    const sanitizedLinks = socialLinks as Record<string, string>;

    if (sanitizedLinks.instagram && !sanitizedLinks.instagram.includes('instagram.com')) {
      errors.instagram = 'URL de Instagram no válida.';
    }
    if (sanitizedLinks.twitter && !(sanitizedLinks.twitter.includes('twitter.com') || sanitizedLinks.twitter.includes('x.com'))) {
      errors.twitter = 'URL de Twitter/X no válida.';
    }
    if (sanitizedLinks.youtube && !sanitizedLinks.youtube.includes('youtube.com')) {
      errors.youtube = 'URL de YouTube no válida.';
    }
    if (sanitizedLinks.facebook && !sanitizedLinks.facebook.includes('facebook.com')) {
      errors.facebook = 'URL de Facebook no válida.';
    }
    if (sanitizedLinks.tiktok && !sanitizedLinks.tiktok.includes('tiktok.com')) {
      errors.tiktok = 'URL de TikTok no válida.';
    }
    if (sanitizedLinks.linkedin && !sanitizedLinks.linkedin.includes('linkedin.com')) {
      errors.linkedin = 'URL de LinkedIn no válida.';
    }
    if (sanitizedLinks.discord && !(sanitizedLinks.discord.includes('discord.gg') || sanitizedLinks.discord.includes('discord.com/invite'))) {
      errors.discord = 'Debe ser un enlace de invitación de Discord (discord.gg/... o discord.com/invite/...).';
    }
    setLinkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTag = () => {
    if (selectedTag && !tags.includes(selectedTag)) {
        setTags([...tags, selectedTag]);
        setSelectedTag(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };


  const handleSave = async () => {
    if (!validateLinks()) {
      toast({
        title: "Revisa los enlaces",
        description: "Algunas de las URLs de redes sociales no son válidas.",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const correctedUrl = correctMalformedUrl(photoUrl);
      const nationalityName = countryCodeToNameMap.get(nationalityCode) || '';
      
      await updateFigureInFirestore({ 
        id: figure.id, 
        name,
        nationality: nationalityName,
        nationalityCode: nationalityCode,
        gender,
        birthDateOrAge: birthDate ? birthDate.toISOString() : '',
        maritalStatus,
        height: `${heightCm} cm`,
        heightCm: heightCm,
        photoUrl: correctedUrl,
        socialLinks: socialLinks,
        tags: tags,
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
    if (linkErrors[platform as keyof SocialLinkErrors]) {
      setLinkErrors(prev => ({...prev, [platform]: undefined }));
    }
  };

  const hasBasicInfo = figure.name || figure.occupation || figure.nationality || figure.gender || figure.category;
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
  const hasTags = figure.tags && figure.tags.length > 0;

  const hasAnyInfo = hasBasicInfo || hasDetailedInfo || hasPhysicalInfo || hasSocialLinks || hasTags;

  const birthDateAndAge = useMemo(() => {
    if (figure.birthDateOrAge) {
      try {
        const date = new Date(figure.birthDateOrAge);
        if (!isNaN(date.getTime())) {
          const age = differenceInYears(new Date(), date);
          const formattedDate = format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
          return `${formattedDate} (${age} años)`;
        }
      } catch (error) {
        return figure.birthDateOrAge;
      }
    }
    return undefined;
  }, [figure.birthDateOrAge]);

  const nationalityFlagUrl = useMemo(() => {
      if (!figure.nationalityCode) return null;
      return `https://flagcdn.com/w40/${figure.nationalityCode.toLowerCase()}.png`;
  }, [figure.nationalityCode]);

  const genderInfo = useMemo(() => {
    if (!figure.gender) return null;

    const genderOption = GENDER_OPTIONS.find(g => g.label === figure.gender);
    if (!genderOption) return <p className="text-muted-foreground text-sm">{figure.gender}</p>;

    const colorClass = genderOption.value === 'male' ? 'text-blue-400' : 'text-pink-400';
    
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{figure.gender}</span>
            {genderOption.symbol && <span className={cn(colorClass, "font-bold")}>{genderOption.symbol}</span>}
        </div>
    );
}, [figure.gender]);


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Información Detallada</CardTitle>
          <CardDescription>
            Datos biográficos y descriptivos de {figure.name}.
          </CardDescription>
        </div>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-6 p-4 border-dashed border rounded-md animate-in fade-in-50">
            <div>
              <h3 className="font-semibold mb-4 text-lg">Modo de Edición</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo de la figura" />
                </div>
                 <div>
                  <Label htmlFor="nationalityCode">Nacionalidad</Label>
                  <CountryCombobox
                    value={nationalityCode}
                    onChange={(value) => setNationalityCode(value || '')}
                  />
                </div>
                <div>
                    <Label htmlFor="gender">Género</Label>
                    <Select onValueChange={setGender} value={gender}>
                        <SelectTrigger id="gender"><SelectValue placeholder="Selecciona un género" /></SelectTrigger>
                        <SelectContent>{GENDER_OPTIONS.map((opt) => ( (opt.value === 'male' || opt.value === 'female') && <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
                <div>
                  <Label htmlFor="birthDateOrAge">Fecha de Nacimiento</Label>
                  <DatePicker
                    date={birthDate}
                    onDateChange={setBirthDate}
                  />
                </div>
                <div>
                  <Label htmlFor="maritalStatus">Estado Civil</Label>
                  <Select onValueChange={setMaritalStatus} value={maritalStatus}>
                    <SelectTrigger id="maritalStatus">
                      <SelectValue placeholder="Selecciona un estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="heightCm">Altura ({heightCm} cm)</Label>
                  <Slider
                    id="heightCm"
                    min={50}
                    max={250}
                    step={1}
                    value={[heightCm]}
                    onValueChange={(value) => setHeightCm(value[0])}
                  />
                </div>
              </div>
            </div>
            
            <Separator />

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
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/100x150.png";
                      target.srcset = "";
                    }}
                  />
                </div>
              </div>
            )}
            
            <Separator />

            <div>
               <h3 className="font-semibold mb-2">Editar Redes Sociales</h3>
               <div className="space-y-3">
                 <div>
                   <Label htmlFor="instagram">Instagram</Label>
                   <Input id="instagram" value={(socialLinks as Record<string, string>)?.instagram || ''} onChange={(e) => handleSocialLinkChange('instagram', e.target.value)} placeholder="https://instagram.com/..." />
                   {linkErrors.instagram && <p className="text-xs text-destructive mt-1">{linkErrors.instagram}</p>}
                 </div>
                 <div>
                   <Label htmlFor="twitter">X (Twitter)</Label>
                   <Input id="twitter" value={(socialLinks as Record<string, string>)?.twitter || ''} onChange={(e) => handleSocialLinkChange('twitter', e.target.value)} placeholder="https://x.com/..." />
                   {linkErrors.twitter && <p className="text-xs text-destructive mt-1">{linkErrors.twitter}</p>}
                 </div>
                 <div>
                   <Label htmlFor="youtube">YouTube</Label>
                   <Input id="youtube" value={(socialLinks as Record<string, string>)?.youtube || ''} onChange={(e) => handleSocialLinkChange('youtube', e.target.value)} placeholder="https://youtube.com/..." />
                   {linkErrors.youtube && <p className="text-xs text-destructive mt-1">{linkErrors.youtube}</p>}
                  </div>
                 <div>
                   <Label htmlFor="facebook">Facebook</Label>
                   <Input id="facebook" value={(socialLinks as Record<string, string>)?.facebook || ''} onChange={(e) => handleSocialLinkChange('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                   {linkErrors.facebook && <p className="text-xs text-destructive mt-1">{linkErrors.facebook}</p>}
                  </div>
                  <div>
                   <Label htmlFor="tiktok">TikTok</Label>
                   <Input id="tiktok" value={(socialLinks as Record<string, string>)?.tiktok || ''} onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)} placeholder="https://tiktok.com/@..." />
                   {linkErrors.tiktok && <p className="text-xs text-destructive mt-1">{linkErrors.tiktok}</p>}
                  </div>
                 <div>
                   <Label htmlFor="linkedin">LinkedIn</Label>
                   <Input id="linkedin" value={(socialLinks as Record<string, string>)?.linkedin || ''} onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
                   {linkErrors.linkedin && <p className="text-xs text-destructive mt-1">{linkErrors.linkedin}</p>}
                  </div>
                 <div>
                   <Label htmlFor="discord">Discord</Label>
                   <Input id="discord" value={(socialLinks as Record<string, string>)?.discord || ''} onChange={(e) => handleSocialLinkChange('discord', e.target.value)} placeholder="https://discord.gg/..." />
                   {linkErrors.discord && <p className="text-xs text-destructive mt-1">{linkErrors.discord}</p>}
                  </div>
               </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Editar Etiquetas</h3>
              <div className="flex gap-2">
                <Combobox
                  options={TAG_OPTIONS.map(tag => ({ value: tag, label: tag }))}
                  value={selectedTag || ''}
                  onChange={(value) => setSelectedTag(value)}
                  placeholder="Selecciona una etiqueta..."
                />
                <Button type="button" onClick={handleAddTag} disabled={!selectedTag}>
                  Añadir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Selecciona de la lista predefinida de etiquetas.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive"
                      aria-label={`Eliminar etiqueta ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
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
                      <InfoItem icon={UserCircle} label="Nombre" value={figure.name} />
                      <InfoItem icon={Briefcase} label="Ocupación" value={figure.occupation} />
                      <InfoItem icon={Globe} label="Nacionalidad" value={figure.nationality} imageUrl={nationalityFlagUrl} />
                      <InfoItem icon={Users} label="Género" value={genderInfo} />
                      <InfoItem icon={BookOpen} label="Categoría" value={figure.category} />
                  </div>
                )}
                {hasDetailedInfo && (
                  <div className="space-y-4">
                      <h3 className="font-headline text-lg">General</h3>
                      <InfoItem icon={NotepadText} label="Alias" value={figure.alias} />
                      <InfoItem icon={Zap} label="Especie" value={figure.species} />
                      <InfoItem icon={BookOpen} label="Primera Aparición" value={figure.firstAppearance} />
                      <InfoItem icon={Cake} label="Nacimiento" value={birthDateAndAge} />
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
                   <div className="flex items-center gap-6 flex-wrap">
                      {Object.entries(SOCIAL_MEDIA_CONFIG).map(([key, { label, imageUrl }]) => {
                        const link = (figure.socialLinks as Record<string, string> | undefined)?.[key];
                        return link ? <SocialLink key={key} href={link} imageUrl={imageUrl} label={label} /> : null;
                      })}
                   </div>
                </div>
              </>
            )}

            {hasTags && <Separator />}

            {hasTags && (
               <div>
                   <h3 className="font-headline text-lg mb-4">Etiquetas</h3>
                   <FigureTags tags={figure.tags!} />
               </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
