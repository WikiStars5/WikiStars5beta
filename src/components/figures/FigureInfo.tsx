
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
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap, UserCircle, Briefcase, Globe, Users, Edit, Save, X, Loader2, Link as LinkIcon, Gamepad2, Clapperboard, MonitorPlay, Building, Book, Tag, PawPrint, FilePenLine
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { FigureTags } from './FigureTags';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateFigureInFirestore } from '@/lib/placeholder-data';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CountryCombobox } from '../shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../shared/DatePicker';

interface FigureInfoProps {
  figure: Figure;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  imageUrl?: string | null;
  href?: string;
  isEditable?: boolean;
  field?: keyof Figure;
  formData?: Partial<Figure>;
  onFormChange?: (field: keyof Figure, value: any) => void;
}

const SOCIAL_MEDIA_CONFIG = {
  instagram: { label: 'Instagram', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Finstagram.png?alt=media&token=91707034-56b6-411f-9504-9273dd0f8b64' },
  twitter: { label: 'X (Twitter)', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ftwitter.webp?alt=media&token=492950d1-1987-48f0-a149-02290cfa1ffc' },
  youtube: { label: 'YouTube', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fyoutube.png?alt=media&token=8952da33-736f-4718-b6d9-fcc99dd93111' },
  facebook: { label: 'Facebook', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ffacebook.png?alt=media&token=100d82e3-e8fe-4f84-96a2-79a23fed43b4' },
  tiktok: { label: 'TikTok', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ftiktok.png?alt=media&token=87f84943-a74c-4916-9a2c-c4a2b3451cbc' },
  linkedin: { label: 'LinkedIn', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flinkedin.png?alt=media&token=cdc7c2b8-e71a-47de-b261-b44b96f5bf0a' },
  discord: { label: 'Discord', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fdiscord.png?alt=media&token=dbb8b8d1-c5d8-4673-b91f-25b1d796195c' },
};

const MARITAL_STATUS_OPTIONS = [
    { value: 'Soltero/a', label: 'Soltero/a' },
    { value: 'Casado/a', label: 'Casado/a' },
    { value: 'Viudo/a', label: 'Viudo/a' },
    { value: 'Divorciado/a', label: 'Divorciado/a' },
    { value: 'Separado/a legalmente', label: 'Separado/a legalmente' },
    { value: 'Conviviente / En unión de hecho', label: 'Conviviente / En unión de hecho' },
];

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, imageUrl, href }) => {
  if (!value && !imageUrl) return null;

  const content = (
    <>
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
    </>
  );

  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {href ? (
             <Link href={href} className="flex items-center gap-2 text-primary hover:underline transition-colors">
                {content}
                <LinkIcon className="h-3 w-3" />
            </Link>
          ) : content}
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

const CharacterInfoTemplate = ({ figure }: { figure: Figure }) => {
    const nationalityFlagUrl = useMemo(() => {
      if (!figure.nationalityCode) return null;
      return `https://flagcdn.com/w40/${figure.nationalityCode.toLowerCase()}.png`;
    }, [figure.nationalityCode]);

    const birthDateAndAge = useMemo(() => {
        if (figure.birthDateOrAge) {
        try {
            const date = new Date(figure.birthDateOrAge);
            if (!isNaN(date.getTime())) {
            const age = differenceInYears(new Date(), date);
            const formattedDate = format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
            return `${formattedDate} (${age} años)`;
            }
        } catch (error) { return figure.birthDateOrAge; }
        }
        return undefined;
    }, [figure.birthDateOrAge]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <div className="space-y-4"><h3 className="font-headline text-lg">Básica</h3><InfoItem icon={Briefcase} label="Ocupación" value={figure.occupation} /><InfoItem icon={Globe} label="Nacionalidad" value={figure.nationality} href={figure.nationalityCode ? `/figures/nationality/${figure.nationalityCode}`: undefined} imageUrl={nationalityFlagUrl} /><InfoItem icon={Users} label="Género" value={genderInfo} /><InfoItem icon={Tag} label="Categoría" value={figure.category} /></div>
            <div className="space-y-4"><h3 className="font-headline text-lg">General</h3><InfoItem icon={NotepadText} label="Alias" value={figure.alias} /><InfoItem icon={Zap} label="Especie" value={figure.species} /><InfoItem icon={Cake} label="Nacimiento" value={birthDateAndAge} /><InfoItem icon={MapPin} label="Lugar de Nacimiento" value={figure.birthPlace} /><InfoItem icon={Activity} label="Estado" value={figure.statusLiveOrDead} /><InfoItem icon={HeartHandshake} label="Estado Civil" value={figure.maritalStatus} /></div>
            <div className="space-y-4"><h3 className="font-headline text-lg">Físico</h3><InfoItem icon={StretchVertical} label="Altura" value={figure.height} /><InfoItem icon={Scale} label="Peso" value={figure.weight} /><InfoItem icon={Palette} label="Color de Cabello" value={figure.hairColor} /><InfoItem icon={Eye} label="Color de Ojos" value={figure.eyeColor} /><InfoItem icon={Scan} label="Rasgos Distintivos" value={figure.distinctiveFeatures} /></div>
        </div>
    );
};

const MediaInfoTemplate = ({ figure }: { figure: Figure }) => {
    const releaseDateFormatted = useMemo(() => {
        if (figure.releaseDate) {
        try {
            const date = new Date(figure.releaseDate);
            if (!isNaN(date.getTime())) {
            return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
            }
        } catch (error) { return figure.releaseDate; }
        }
        return undefined;
    }, [figure.releaseDate]);

    return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <div className="space-y-4">
                <InfoItem icon={Clapperboard} label="Género" value={figure.mediaGenre} />
                <InfoItem icon={Cake} label="Fecha de Lanzamiento" value={releaseDateFormatted} />
            </div>
            {(figure.mediaSubcategory === 'movie' || figure.mediaSubcategory === 'series' || figure.mediaSubcategory === 'anime') && (
                <div className="space-y-4">
                    <InfoItem icon={UserCircle} label="Director" value={figure.director} />
                    <InfoItem icon={Building} label="Estudio" value={figure.studio} />
                </div>
            )}
            {figure.mediaSubcategory === 'video_game' && (
                <div className="space-y-4">
                    <InfoItem icon={UserCircle} label="Desarrollador" value={figure.developer} />
                    <InfoItem icon={Gamepad2} label="Plataformas" value={figure.platforms?.join(', ')} />
                </div>
            )}
            {(figure.mediaSubcategory === 'book' || figure.mediaSubcategory === 'manga_comic' || figure.mediaSubcategory === 'board_game') && (
                <div className="space-y-4">
                    <InfoItem icon={UserCircle} label="Autor/Escritor" value={figure.author} />
                    <InfoItem icon={Palette} label="Artista/Dibujante" value={figure.artist} />
                </div>
            )}
            {(figure.mediaSubcategory === 'company' || figure.mediaSubcategory === 'website' || figure.mediaSubcategory === 'social_media_platform') && (
                <div className="space-y-4">
                    <InfoItem icon={UserCircle} label="Fundador" value={figure.founder} />
                    <InfoItem icon={Briefcase} label="Industria" value={figure.industry} />
                    <InfoItem icon={LinkIcon} label="Sitio Web" value={figure.websiteUrl} href={figure.websiteUrl} />
                </div>
            )}
            {figure.mediaSubcategory === 'animal' && (
                <div className="space-y-4">
                    <InfoItem icon={PawPrint} label="Especie" value={figure.species} />
                </div>
            )}
        </div>
    );
};


export function FigureInfo({ figure }: FigureInfoProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Figure>>(figure);

  useEffect(() => {
    if (!isEditing) {
      setFormData(figure);
    }
  }, [figure, isEditing]);

  const handleInputChange = (field: keyof Figure, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateFigureInFirestore({ ...formData, id: figure.id });
      toast({ title: "Perfil Actualizado", description: "Los cambios han sido guardados." });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating figure:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(figure); // Reset changes
    setIsEditing(false);
  };
  
  const hasSocialLinks = Object.values(figure.socialLinks || {}).some(link => !!link);
  const hasTags = figure.tags && figure.tags.length > 0;

  const hasAnyInfo = figure.profileType === 'character' ? 
      (figure.occupation || figure.nationality || figure.gender || figure.category) :
      (figure.mediaGenre || figure.releaseDate || figure.developer || (figure.platforms && figure.platforms.length > 0));

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Información Detallada</CardTitle>
          <CardDescription>
              Datos biográficos y descriptivos de {figure.name}.
          </CardDescription>
        </div>
        {isAdmin && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <FilePenLine className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
         {isAdmin && isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          // EDITING MODE
          <div className="space-y-4 animate-in fade-in-50">
            <p className="font-semibold text-lg">Editando Información de {figure.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Nombre Completo</Label>
                    <Input value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
                </div>
                {figure.profileType === 'character' && (
                    <>
                        <div>
                            <Label>Nacionalidad</Label>
                            <CountryCombobox value={formData.nationalityCode || ''} onChange={code => handleInputChange('nationalityCode', code)} />
                        </div>
                        <div>
                            <Label>Género</Label>
                            <Select onValueChange={value => handleInputChange('gender', value)} value={formData.gender}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un género" /></SelectTrigger>
                                <SelectContent>{GENDER_OPTIONS.map((o) => ((o.value === 'male' || o.value === 'female') && (<SelectItem key={o.value} value={o.label}>{o.label}</SelectItem>)))}</SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label>Fecha de Nacimiento</Label>
                            <DatePicker 
                                date={formData.birthDateOrAge ? new Date(formData.birthDateOrAge) : undefined} 
                                onDateChange={date => handleInputChange('birthDateOrAge', date?.toISOString())} 
                            />
                        </div>
                        <div>
                            <Label>Estado Civil</Label>
                            <Select onValueChange={value => handleInputChange('maritalStatus', value)} value={formData.maritalStatus}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un estado civil" /></SelectTrigger>
                                <SelectContent>{MARITAL_STATUS_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Altura (cm)</Label>
                            <Input value={formData.height || ''} onChange={e => handleInputChange('height', e.target.value)} placeholder="Ej: 175 cm"/>
                        </div>
                    </>
                )}
                 {figure.profileType === 'media' && (
                     <>
                        <div>
                            <Label>Género del Medio</Label>
                            <Input value={formData.mediaGenre || ''} onChange={e => handleInputChange('mediaGenre', e.target.value)} placeholder="Ej: Acción, RPG"/>
                        </div>
                        <div>
                            <Label>Fecha de Lanzamiento</Label>
                             <DatePicker 
                                date={formData.releaseDate ? new Date(formData.releaseDate) : undefined} 
                                onDateChange={date => handleInputChange('releaseDate', date?.toISOString())} 
                            />
                        </div>
                     </>
                 )}
            </div>
          </div>
        ) : (
          // DISPLAY MODE
          <>
            {!hasAnyInfo && !hasSocialLinks && !hasTags ? (
              <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">No hay información detallada disponible para este perfil.</p>
            ) : (
              <div className="space-y-6">
                {figure.profileType === 'character' ? (
                  <CharacterInfoTemplate figure={figure} />
                ) : (
                  <MediaInfoTemplate figure={figure} />
                )}
                
                {hasSocialLinks && <Separator/>}
                {hasSocialLinks && (
                   <div>
                       <h3 className="font-headline text-lg mb-4">Redes Sociales</h3>
                       <div className="flex items-center gap-6 flex-wrap">
                          {Object.entries(SOCIAL_MEDIA_CONFIG).map(([key, { label, imageUrl }]) => {
                            const link = (figure.socialLinks as Record<string, string> | undefined)?.[key];
                            return link ? <SocialLink key={key} href={link} imageUrl={imageUrl} label={label} /> : null;
                          })}
                       </div>
                   </div>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
