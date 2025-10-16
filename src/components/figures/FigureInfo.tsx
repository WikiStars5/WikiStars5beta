

"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Figure, MediaSubcategory, Hashtag } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
    Cake, MapPin, Activity, HeartHandshake, StretchVertical, UserCircle, Briefcase, Globe, Users, Edit, Save, X, Loader2, Link as LinkIcon, FilePenLine, Skull, Image as ImageIcon, Weight, Tags, Gamepad2, Building, Clapperboard, MonitorPlay, Book, PawPrint, Plus
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FigureHashtags } from './FigureHashtags';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateFigureInFirestore } from '@/lib/placeholder-data';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CountryCombobox } from '../shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../shared/DatePicker';
import { MediaInfoTemplate } from './infobox-templates/MediaInfoTemplate';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { VIDEO_GAME_GENRES } from '@/config/genres';
import { Combobox } from '../shared/Combobox';
import { searchHashtags } from '@/app/actions/searchHashtagsAction';
import { differenceInYears } from 'date-fns';

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

const SOCIAL_MEDIA_CONFIG: Record<string, { label: string }> = {
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

const MEDIA_SUBCATEGORIES: { value: MediaSubcategory, label: string }[] = [
    { value: 'video_game', label: 'Videojuego' },
    { value: 'movie', label: 'Película' },
    { value: 'series', label: 'Serie' },
    { value: 'anime', label: 'Anime' },
    { value: 'manga_comic', label: 'Manga/Cómic' },
    { value: 'book', label: 'Libro/Novela' },
    { value: 'board_game', label: 'Juegos de mesa' },
    { value: 'animal', label: 'Animales' },
    { value: 'company', label: 'Empresa' },
    { value: 'website', label: 'Página Web' },
    { value: 'social_media_platform', label: 'Red Social' },
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


const SocialLink: React.FC<{ href?: string; label: string; icon?: React.ElementType }> = ({ href, label, icon: Icon }) => {
  if (!href) return null;
  
   const getFaviconUrl = (link: string) => {
    try {
        const url = new URL(link);
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${url.hostname}`;
    } catch (e) {
        return null;
    }
  };
  
  const faviconUrl = !Icon ? getFaviconUrl(href) : null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
      <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-muted/50 hover:border-primary p-2">
           {Icon ? (
            <Icon className="h-6 w-6" />
           ) : faviconUrl ? (
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

    const socialLinksArray = Object.entries(figure.socialLinks || {}).filter(([,link]) => !!link);
    const hasSocialLinks = socialLinksArray.length > 0;
    const hasHashtags = figure.hashtags && figure.hashtags.length > 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                <InfoItem icon={UserCircle} label="Nombre Completo" value={figure.name} />
                <InfoItem icon={Users} label="Sexo" value={genderInfo} />
                <InfoItem icon={Cake} label="Nacimiento" value={birthDate} />
                <InfoItem icon={Skull} label="Fallecimiento" value={deathDate} />
                <InfoItem icon={Globe} label="País de origen" value={figure.nationality} href={figure.nationalityCode ? `/figures/nationality/${figure.nationalityCode}`: undefined} imageUrl={nationalityFlagUrl} />
                <InfoItem icon={Briefcase} label="Ocupación" value={figure.occupation} />
                <InfoItem icon={HeartHandshake} label="Estado civil" value={figure.maritalStatus} />
                <InfoItem icon={StretchVertical} label="Altura" value={figure.height} />
                <InfoItem icon={Weight} label="Peso" value={figure.weight} />
                <InfoItem icon={LinkIcon} label="Página Web" value={figure.socialLinks?.website} href={figure.socialLinks?.website} />
            </div>
             {hasSocialLinks && (
                 <div className="md:col-span-2 lg:col-span-3">
                   <Separator className="my-4"/>
                   <h3 className="font-headline text-base mb-4">Redes Sociales</h3>
                   <div className="flex items-center gap-6 flex-wrap">
                      {Object.entries(figure.socialLinks || {}).map(([key, link]) => {
                         const config = SOCIAL_MEDIA_CONFIG[key as keyof typeof SOCIAL_MEDIA_CONFIG];
                         if (key === 'website') return null;
                         return link && config ? <SocialLink key={key} href={link} label={config.label} /> : null;
                      })}
                   </div>
                </div>
             )}

             {hasHashtags && (
                <div className="md:col-span-2 lg:col-span-3">
                   <Separator className="my-4"/>
                   <h3 className="font-headline text-base mb-4">Hashtags</h3>
                   <FigureHashtags hashtags={figure.hashtags!} />
                </div>
            )}
        </div>
    );
};

export function FigureInfo({ figure }: { figure: Figure }) {
  const hasInfo = useMemo(() => {
    if (figure.profileType === 'character') {
      return Object.values({
        occupation: figure.occupation,
        nationality: figure.nationality,
        gender: figure.gender,
        birthDateOrAge: figure.birthDateOrAge,
        deathDate: figure.deathDate,
        maritalStatus: figure.maritalStatus,
        height: figure.height,
        weight: figure.weight,
        alias: figure.alias,
      }).some(Boolean);
    }
    // Corrected, robust check for media profiles
    return Object.values({
        mediaGenre: figure.mediaGenre,
        releaseDate: figure.releaseDate,
        developer: figure.developer,
        publisher: figure.publisher,
        nationality: figure.nationality,
        platforms: (figure.platforms ?? []).length > 0,
        director: figure.director,
        studio: figure.studio,
        author: figure.author,
        artist: figure.artist,
        founder: figure.founder,
        industry: figure.industry,
        websiteUrl: figure.websiteUrl,
        species: figure.species,
    }).some(Boolean);
  }, [figure]);

  if ((!hasInfo && !figure.hashtags?.length && Object.values(figure.socialLinks || {}).every(v => !v))) {
    return <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">No hay información detallada disponible para este perfil.</p>
  }
  
  return figure.profileType === 'character' ? <CharacterInfoTemplate figure={figure} /> : <MediaInfoTemplate figure={figure} />
}


interface EditableFigureInfoProps {
  figure: Figure;
}

const MAX_HASHTAGS = 10;

export function EditableFigureInfo({ figure: initialFigure }: EditableFigureInfoProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Figure>>(initialFigure);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtagOptions, setHashtagOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);

  // When the initialFigure prop changes (due to real-time updates),
  // update our form data *if not in editing mode*.
  useEffect(() => {
    if (!isEditing) {
      setFormData(initialFigure);
    }
  }, [initialFigure, isEditing]);
  
  const debouncedSearchHashtags = useCallback(debounce(async (searchTerm: string) => {
    if (!searchTerm) {
        setHashtagOptions([]);
        setIsLoadingHashtags(false);
        return;
    }
    setIsLoadingHashtags(true);
    const results = await searchHashtags(searchTerm);
    const options = results.map(h => ({ value: h.id, label: `#${h.id}`}));
    setHashtagOptions(options);
    setIsLoadingHashtags(false);
  }, 300), []);

  useEffect(() => {
    if (isEditing) {
      debouncedSearchHashtags(hashtagInput);
    }
  }, [hashtagInput, isEditing, debouncedSearchHashtags]);
  
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
  
  const handleAddHashtag = (tagToAdd: string) => {
    const currentHashtags = formData.hashtags || [];
    if (currentHashtags.length >= MAX_HASHTAGS) {
        toast({
            title: "Límite de hashtags alcanzado",
            description: `Solo puedes añadir hasta ${MAX_HASHTAGS} hashtags.`,
            variant: "destructive",
        });
        return;
    }
    const trimmedTag = tagToAdd.trim().replace(/#/g, '');
    if (trimmedTag && !currentHashtags.includes(trimmedTag)) {
        setFormData(prev => ({
            ...prev,
            hashtags: [...currentHashtags, trimmedTag]
        }));
    }
    setHashtagInput('');
    setHashtagOptions([]);
  };

  const handleRemoveHashtag = (hashtagToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        hashtags: (prev.hashtags || []).filter(tag => tag !== hashtagToRemove)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const figureData: Partial<Figure> & { id: string } = { ...formData, id: initialFigure.id };
      
      // Calculate age if birthDate is provided
      if (figureData.birthDateOrAge) {
        try {
            const birthDate = new Date(figureData.birthDateOrAge);
            if (!isNaN(birthDate.getTime())) {
                figureData.age = differenceInYears(new Date(), birthDate);
            }
        } catch (e) {
             console.error("Invalid date for age calculation", e)
        }
      }

      await updateFigureInFirestore(figureData);
      
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
    setFormData(initialFigure); // Reset changes
    setIsEditing(false);
  };

  const previewImageUrl = useMemo(() => correctMalformedUrl(formData.photoUrl), [formData.photoUrl]);

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Información Detallada</CardTitle>
          <CardDescription>
              Datos biográficos y descriptivos de {initialFigure.name}.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            {isEditing ? (
            <>
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar
                </Button>
            </>
            ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <FilePenLine className="mr-2 h-4 w-4" />
                Editar
            </Button>
            )}
        </div>
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

            <p className="font-semibold text-lg">Editando Información de {initialFigure.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Nombre Completo</Label>
                    <Input value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
                </div>
                {initialFigure.profileType === 'character' ? (
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
                            <Label>País de origen</Label>
                            <CountryCombobox value={formData.nationalityCode || ''} onChange={code => handleInputChange('nationalityCode', code)} />
                        </div>
                         <div>
                            <Label>Ocupación</Label>
                            <Input value={formData.occupation || ''} onChange={e => handleInputChange('occupation', e.target.value)} />
                        </div>
                        <div>
                            <Label>Estado Civil</Label>
                            <Select onValueChange={value => handleInputChange('maritalStatus', value)} value={formData.maritalStatus}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un estado civil" /></SelectTrigger>
                                <SelectContent>{MARITAL_STATUS_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                           <Label>{`Altura: ${formData.heightCm ? `${formData.heightCm} cm` : 'No especificada'}`}</Label>
                            <Slider
                                min={40}
                                max={250}
                                step={1}
                                value={formData.heightCm ? [formData.heightCm] : [150]}
                                onValueChange={(value) => handleInputChange('heightCm', value[0])}
                            />
                        </div>
                         <div className="md:col-span-2">
                           <Label>Peso (ej. 75 kg)</Label>
                            <Input value={formData.weight || ''} onChange={e => handleInputChange('weight', e.target.value)} />
                        </div>
                    </>
                ) : (
                     <>
                        <div>
                            <Label>País de origen</Label>
                            <CountryCombobox value={formData.nationalityCode || ''} onChange={code => handleInputChange('nationalityCode', code)} />
                        </div>
                        <div>
                            <Label>Fecha de Lanzamiento</Label>
                            <DatePicker 
                                date={formData.releaseDate ? new Date(formData.releaseDate) : undefined} 
                                onDateChange={date => handleInputChange('releaseDate', date?.toISOString())} 
                            />
                        </div>
                        {initialFigure.mediaSubcategory === 'video_game' && (
                          <>
                             <div>
                                <Label>Género</Label>
                                <Select onValueChange={(value) => handleInputChange('mediaGenre', value)} value={formData.mediaGenre}>
                                    <SelectTrigger><SelectValue placeholder="Selecciona un género" /></SelectTrigger>
                                    <SelectContent>{VIDEO_GAME_GENRES.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label>Desarrollador</Label>
                                <Input value={formData.developer || ''} onChange={e => handleInputChange('developer', e.target.value)} />
                            </div>
                          </>
                        )}
                     </>
                 )}
            </div>
            <Separator/>
             <div className="space-y-4">
                 <h3 className="text-lg font-semibold">Editar Redes Sociales y Enlaces</h3>
                <div><Label>Página Web</Label><Input value={formData.socialLinks?.website || ''} onChange={e => handleSocialLinkChange('website', e.target.value)} placeholder="https://..."/></div>
                {formData.mediaSubcategory === 'video_game' && (
                    <>
                        <div><Label>Google Play Store</Label><Input value={formData.socialLinks?.playStoreUrl || ''} onChange={e => handleSocialLinkChange('playStoreUrl', e.target.value)} placeholder="https://play.google.com/..."/></div>
                        <div><Label>Apple App Store</Label><Input value={formData.socialLinks?.appStoreUrl || ''} onChange={e => handleSocialLinkChange('appStoreUrl', e.target.value)} placeholder="https://apps.apple.com/..."/></div>
                        <div><Label>Steam</Label><Input value={formData.socialLinks?.steamUrl || ''} onChange={e => handleSocialLinkChange('steamUrl', e.target.value)} placeholder="https://store.steampowered.com/..."/></div>
                    </>
                )}
                <div><Label>Instagram</Label><Input value={formData.socialLinks?.instagram || ''} onChange={e => handleSocialLinkChange('instagram', e.target.value)} placeholder="https://instagram.com/..."/></div>
                <div><Label>X (Twitter)</Label><Input value={formData.socialLinks?.twitter || ''} onChange={e => handleSocialLinkChange('twitter', e.target.value)} placeholder="https://x.com/..."/></div>
                <div><Label>YouTube</Label><Input value={formData.socialLinks?.youtube || ''} onChange={e => handleSocialLinkChange('youtube', e.target.value)} placeholder="https://youtube.com/..."/></div>
                <div><Label>Facebook</Label><Input value={formData.socialLinks?.facebook || ''} onChange={e => handleSocialLinkChange('facebook', e.target.value)} placeholder="https://facebook.com/..."/></div>
                <div><Label>TikTok</Label><Input value={formData.socialLinks?.tiktok || ''} onChange={e => handleSocialLinkChange('tiktok', e.target.value)} placeholder="https://tiktok.com/@..."/></div>
                <div><Label>LinkedIn</Label><Input value={formData.socialLinks?.linkedin || ''} onChange={e => handleSocialLinkChange('linkedin', e.target.value)} placeholder="https://linkedin.com/..."/></div>
                <div><Label>Discord</Label><Input value={formData.socialLinks?.discord || ''} onChange={e => handleSocialLinkChange('discord', e.target.value)} placeholder="https://discord.gg/..."/></div>
            </div>
            <Separator/>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Tags /> Editar Hashtags</h3>
               <div className="flex gap-2">
                <Combobox
                    options={hashtagOptions}
                    value={hashtagInput}
                    onValueChange={setHashtagInput}
                    onSelect={(value) => {
                        if (value) handleAddHashtag(value);
                    }}
                    isLoading={isLoadingHashtags}
                    placeholder="Buscar o crear hashtag..."
                    disabled={(formData.hashtags?.length || 0) >= MAX_HASHTAGS}
                />
                <Button 
                    type="button" 
                    onClick={() => handleAddHashtag(hashtagInput)}
                    disabled={(formData.hashtags?.length || 0) >= MAX_HASHTAGS || !hashtagInput.trim()}
                >
                    <Plus className="h-4 w-4 mr-2" /> Añadir
                </Button>
              </div>
              {(formData.hashtags?.length || 0) >= MAX_HASHTAGS && (
                <p className="text-xs text-destructive">Se ha alcanzado el límite de {MAX_HASHTAGS} hashtags.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {(formData.hashtags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive"
                      aria-label={`Eliminar ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <FigureInfo figure={initialFigure} />
        )}
      </CardContent>
    </Card>
  );
}
