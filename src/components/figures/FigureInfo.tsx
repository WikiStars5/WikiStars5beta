

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
    Cake, MapPin, Activity, HeartHandshake, StretchVertical, UserCircle, Briefcase, Globe, Users, Edit, Save, X, Loader2, Link as LinkIcon, FilePenLine, Skull, Image as ImageIcon
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FigureTags } from './FigureTags';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { cn, correctMalformedUrl } from '@/lib/utils';
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
import { MediaInfoTemplate } from './infobox-templates/MediaInfoTemplate';

interface FigureInfoProps {
  figure: Figure;
}

const SOCIAL_MEDIA_CONFIG: Record<keyof Figure['socialLinks'], { label: string }> = {
  website: { label: 'Página Web' },
  instagram: { label: 'Instagram' },
  twitter: { label: 'X (Twitter)' },
  youtube: { label: 'YouTube' },
  facebook: { label: 'Facebook' },
  tiktok: { label: 'TikTok' },
  linkedin: { label: 'LinkedIn' },
  discord: { label: 'Discord' },
};


const MARITAL_STATUS_OPTIONS = [
    { value: 'Soltero/a', label: 'Soltero/a' },
    { value: 'Casado/a', label: 'Casado/a' },
    { value: 'Viudo/a', label: 'Viudo/a' },
    { value: 'Divorciado/a', label: 'Divorciado/a' },
    { value: 'Separado/a legalmente', label: 'Separado/a legalmente' },
    { value: 'Conviviente / En unión de hecho', label: 'Conviviente / En unión de hecho' },
];

const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  imageUrl?: string | null;
  href?: string;
}> = ({ icon: Icon, label, value, imageUrl, href }) => {
  if (!value && !imageUrl && !href) return null;
  
  const getFaviconUrl = (link: string) => {
    try {
      const url = new URL(link);
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${url.hostname}`;
    } catch (e) {
      return null;
    }
  };
  
  const faviconUrl = href ? getFaviconUrl(href) : null;

  const content = (
    <>
        {faviconUrl ? (
            <Image
                src={faviconUrl}
                alt={label}
                width={16}
                height={16}
                className="w-4 h-4 flex-shrink-0"
            />
        ) : imageUrl ? (
            <Image
                src={imageUrl}
                alt={typeof value === 'string' ? value : label}
                width={20}
                height={15}
                className="w-5 h-auto flex-shrink-0"
            />
        ) : null}

        {typeof value === 'string' ? (
            <p className="text-muted-foreground text-sm">{value}</p>
        ) : (
            value
        )}
    </>
  );

  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex flex-col">
        <p className="font-semibold text-sm">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {href ? (
             <Link href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline transition-colors">
                {content}
                <LinkIcon className="h-3 w-3" />
            </Link>
          ) : content}
        </div>
      </div>
    </div>
  );
};


const SocialLink: React.FC<{ href?: string; label: string }> = ({ href, label }) => {
  if (!href) return null;
  
  const getFaviconUrl = (link: string) => {
    try {
        const url = new URL(link);
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${url.hostname}`;
    } catch (e) {
        return null;
    }
  };
  
  const faviconUrl = getFaviconUrl(href);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
      <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-muted/50 hover:border-primary p-2">
          {faviconUrl ? (
            <Image src={faviconUrl} alt={label} width={32} height={32} className="object-contain" />
          ) : (
            <LinkIcon className="h-6 w-6" />
          )}
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

    const birthDate = useMemo(() => {
        if (!figure.birthDateOrAge) return null;
        try {
            const date = new Date(figure.birthDateOrAge);
            if (!isNaN(date.getTime())) {
                return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
            }
        } catch (error) { return figure.birthDateOrAge; }
        return figure.birthDateOrAge;
    }, [figure.birthDateOrAge]);

    const deathDate = useMemo(() => {
        if (!figure.deathDate) return null;
        try {
            const date = new Date(figure.deathDate);
            if (!isNaN(date.getTime())) {
                return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
            }
        } catch (error) { return figure.deathDate; }
        return figure.deathDate;
    }, [figure.deathDate]);

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

    const socialLinksArray = Object.entries(figure.socialLinks || {}).filter(([, link]) => !!link);
    const hasSocialLinks = socialLinksArray.length > 0;
    const hasTags = figure.tags && figure.tags.length > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <InfoItem icon={Users} label="Sexo" value={genderInfo} />
            <InfoItem icon={Cake} label="Nacimiento" value={birthDate} />
            <InfoItem icon={Skull} label="Fallecimiento" value={deathDate} />
            <InfoItem icon={Globe} label="Nacionalidad" value={figure.nationality} href={figure.nationalityCode ? `/figures/nationality/${figure.nationalityCode}`: undefined} imageUrl={nationalityFlagUrl} />
            <InfoItem icon={Briefcase} label="Ocupación" value={figure.occupation} />
            <InfoItem icon={HeartHandshake} label="Estado civil" value={figure.maritalStatus} />
            <InfoItem icon={StretchVertical} label="Altura" value={figure.height} />
            <InfoItem icon={LinkIcon} label="Página Web" value={figure.socialLinks?.website} href={figure.socialLinks?.website} />
            
             {hasSocialLinks && (
                 <div className="md:col-span-2 lg:col-span-3">
                   <Separator className="my-4"/>
                   <h3 className="font-headline text-base mb-4">Redes Sociales</h3>
                   <div className="flex items-center gap-6 flex-wrap">
                      {Object.entries(figure.socialLinks || {}).map(([key, link]) => {
                         const config = SOCIAL_MEDIA_CONFIG[key as keyof typeof SOCIAL_MEDIA_CONFIG];
                         return link && config ? <SocialLink key={key} href={link} label={config.label} /> : null;
                      })}
                   </div>
                </div>
             )}

             {hasTags && (
                <div className="md:col-span-2 lg:col-span-3">
                   <Separator className="my-4"/>
                   <h3 className="font-headline text-base mb-4">Etiquetas</h3>
                   <FigureTags tags={figure.tags!} />
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

  const handleSocialLinkChange = (field: keyof NonNullable<Figure['socialLinks']>, value: string) => {
    setFormData(prev => ({
        ...prev,
        socialLinks: {
            ...prev.socialLinks,
            [field]: value
        }
    }));
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
  
  const hasInfo = figure.profileType === 'character' ? 
      (figure.occupation || figure.nationality || figure.gender || figure.birthDateOrAge || figure.deathDate || figure.maritalStatus || figure.height) :
      (figure.mediaGenre || figure.releaseDate || figure.developer || (figure.platforms && figure.platforms.length > 0));

  const previewImageUrl = useMemo(() => correctMalformedUrl(formData.photoUrl), [formData.photoUrl]);

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
          <div className="space-y-6 animate-in fade-in-50">
             <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><ImageIcon /> Editar Imagen de Perfil</h3>
                <Label htmlFor="photoUrl">URL de la Imagen de Perfil</Label>
                <Input 
                    id="photoUrl" 
                    type="url" 
                    value={formData.photoUrl || ''} 
                    onChange={e => handleInputChange('photoUrl', e.target.value)} 
                    placeholder="Pega un enlace de Wikimedia, Pinterest, etc."
                />
                {previewImageUrl && (
                    <div>
                        <Label>Vista Previa</Label>
                        <div className="mt-2 relative w-32 h-40 rounded-md overflow-hidden bg-muted">
                            <Image src={previewImageUrl} alt="Vista previa" fill className="object-cover" sizes="128px" />
                        </div>
                    </div>
                )}
            </div>
            <Separator/>

            <p className="font-semibold text-lg">Editando Información de {figure.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Nombre Completo</Label>
                    <Input value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
                </div>
                {figure.profileType === 'character' ? (
                    <>
                         <div>
                            <Label>Sexo</Label>
                            <Select onValueChange={value => handleInputChange('gender', value)} value={formData.gender}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un sexo" /></SelectTrigger>
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
                            <Label>Fallecimiento</Label>
                            <DatePicker 
                                date={formData.deathDate ? new Date(formData.deathDate) : undefined} 
                                onDateChange={date => handleInputChange('deathDate', date?.toISOString())} 
                            />
                        </div>
                         <div>
                            <Label>Nacionalidad</Label>
                            <CountryCombobox value={formData.nationalityCode || ''} onChange={code => handleInputChange('nationalityCode', code)} />
                        </div>
                         <div>
                            <Label>Ocupación</Label>
                            <Input value={formData.occupation || ''} onChange={e => handleInputChange('occupation', e.target.value)}/>
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
                        <div>
                            <Label>Página Web</Label>
                            <Input value={formData.socialLinks?.website || ''} onChange={e => handleSocialLinkChange('website', e.target.value)} placeholder="https://..."/>
                        </div>
                    </>
                ) : (
                     <>
                        {/* Add media editing fields here if needed */}
                        <p className="text-sm text-muted-foreground md:col-span-2">La edición en línea para perfiles de medios aún no está implementada.</p>
                     </>
                 )}
            </div>
          </div>
        ) : (
          <>
            {!hasInfo ? (
              <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">No hay información detallada disponible para este perfil.</p>
            ) : (
                figure.profileType === 'character' ? <CharacterInfoTemplate figure={figure} /> : <MediaInfoTemplate figure={figure} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
