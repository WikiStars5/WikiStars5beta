
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
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap, UserCircle, Briefcase, Globe, Users, Edit, Save, X, Loader2, ImageOff, Link as LinkIcon, Gamepad2, Tv, Film, Music, Building, Book, Clapperboard, MonitorPlay, Users2, Code, Tag
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { FigureTags } from './FigureTags';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';


interface FigureInfoProps {
  figure: Figure;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  imageUrl?: string | null;
  href?: string;
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


export function FigureInfo({ figure }: FigureInfoProps) {
  const hasSocialLinks = Object.values(figure.socialLinks || {}).some(link => !!link);
  const hasTags = figure.tags && figure.tags.length > 0;

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
  
  const renderCharacterInfo = () => {
     const hasBasicInfo = figure.occupation || figure.nationality || figure.gender || figure.category;
     const hasDetailedInfo = figure.alias || figure.species || figure.birthDateOrAge || figure.birthPlace || figure.statusLiveOrDead || figure.maritalStatus;
     const hasPhysicalInfo = figure.height || figure.weight || figure.hairColor || figure.eyeColor || figure.distinctiveFeatures;
     if (!hasBasicInfo && !hasDetailedInfo && !hasPhysicalInfo) return null;

    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {hasBasicInfo && (
            <div className="space-y-4">
                <h3 className="font-headline text-lg">Básica</h3>
                <InfoItem icon={Briefcase} label="Ocupación" value={figure.occupation} />
                <InfoItem icon={Globe} label="Nacionalidad" value={figure.nationality} href={figure.nationalityCode ? `/figures/nationality/${figure.nationalityCode}`: undefined} imageUrl={nationalityFlagUrl} />
                <InfoItem icon={Users2} label="Género" value={genderInfo} />
                 <InfoItem icon={Tag} label="Categoría" value={figure.category} />
            </div>
          )}
          {hasDetailedInfo && (
            <div className="space-y-4">
                <h3 className="font-headline text-lg">General</h3>
                <InfoItem icon={NotepadText} label="Alias" value={figure.alias} />
                <InfoItem icon={Zap} label="Especie" value={figure.species} />
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
    )
  }
  
  const renderMediaInfo = () => {
    const hasAnyMediaInfo = figure.mediaGenre || releaseDateFormatted || figure.director || figure.studio || figure.developer || figure.platforms?.length || figure.author || figure.artist || figure.founder || figure.industry || figure.websiteUrl;
    if (!hasAnyMediaInfo) return null;

    const MEDIA_SUBCATEGORY_LABELS: Record<string, string> = {
        video_game: 'Videojuego',
        movie: 'Película',
        series: 'Serie',
        anime: 'Anime',
        manga_comic: 'Manga/Cómic',
        book: 'Libro/Novela',
        company: 'Empresa',
        website: 'Página Web',
        social_media_platform: 'Red Social',
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {/* Common Media Info */}
            <div className="space-y-4">
                <h3 className="font-headline text-lg">{figure.mediaSubcategory ? MEDIA_SUBCATEGORY_LABELS[figure.mediaSubcategory] : 'Detalles del Medio'}</h3>
                <InfoItem icon={Clapperboard} label="Género" value={figure.mediaGenre} />
                <InfoItem icon={Cake} label="Fecha de Lanzamiento" value={releaseDateFormatted} />
            </div>
            
            {/* Movie/Series/Anime Info */}
            {(figure.mediaSubcategory === 'movie' || figure.mediaSubcategory === 'series' || figure.mediaSubcategory === 'anime') && (
                <div className="space-y-4">
                    <h3 className="font-headline text-lg">Producción</h3>
                    <InfoItem icon={UserCircle} label="Director" value={figure.director} />
                    <InfoItem icon={Building} label="Estudio" value={figure.studio} />
                </div>
            )}
            
            {/* Video Game Info */}
            {figure.mediaSubcategory === 'video_game' && (
                <div className="space-y-4">
                    <h3 className="font-headline text-lg">Desarrollo</h3>
                    <InfoItem icon={UserCircle} label="Desarrollador" value={figure.developer} />
                    <InfoItem icon={Gamepad2} label="Plataformas" value={figure.platforms?.join(', ')} />
                </div>
            )}

            {/* Book/Manga/Comic Info */}
            {(figure.mediaSubcategory === 'book' || figure.mediaSubcategory === 'manga_comic') && (
                 <div className="space-y-4">
                    <h3 className="font-headline text-lg">Autoría</h3>
                    <InfoItem icon={UserCircle} label="Autor/Escritor" value={figure.author} />
                    <InfoItem icon={Palette} label="Artista/Dibujante" value={figure.artist} />
                </div>
            )}

             {/* Company/Website/Social Media Info */}
            {(figure.mediaSubcategory === 'company' || figure.mediaSubcategory === 'website' || figure.mediaSubcategory === 'social_media_platform') && (
                <div className="space-y-4">
                    <h3 className="font-headline text-lg">Corporativo</h3>
                    <InfoItem icon={UserCircle} label="Fundador" value={figure.founder} />
                    <InfoItem icon={Briefcase} label="Industria" value={figure.industry} />
                    <InfoItem icon={LinkIcon} label="Sitio Web" value={figure.websiteUrl} href={figure.websiteUrl} />
                </div>
            )}
        </div>
      </div>
    );
  }

  const hasAnyInfo = figure.profileType === 'character' ? 
      (figure.occupation || figure.nationality || figure.gender || figure.category) :
      (figure.mediaGenre || figure.releaseDate || figure.developer || (figure.platforms && figure.platforms.length > 0));


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Información Detallada</CardTitle>
        <CardDescription>
            Datos biográficos y descriptivos de {figure.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyInfo && !hasSocialLinks && !hasTags ? (
           <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">No hay información detallada disponible para este perfil.</p>
        ) : (
          <div className="space-y-6">
            
            {figure.profileType === 'character' ? renderCharacterInfo() : renderMediaInfo()}

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
      </CardContent>
    </Card>
  );
}
