

"use client";

import * as React from 'react';
import type { Figure } from "@/lib/types";
import {
  Cake, Link as LinkIcon, Gamepad2, Clapperboard, MonitorPlay, Building, Book, Tag, PawPrint, UserCircle, Briefcase, Globe, Bot, Download, AppWindow
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FigureHashtags } from '../FigureHashtags';
import { Separator } from '@/components/ui/separator';

const SOCIAL_MEDIA_CONFIG: Record<keyof Figure['socialLinks'], { label: string, icon?: React.ElementType }> = {
  website: { label: 'Página Web' },
  instagram: { label: 'Instagram' },
  twitter: { label: 'X (Twitter)' },
  youtube: { label: 'YouTube' },
  facebook: { label: 'Facebook' },
  tiktok: { label: 'TikTok' },
  linkedin: { label: 'LinkedIn' },
  discord: { label: 'Discord' },
  playStoreUrl: { label: 'Play Store', icon: Bot },
  appStoreUrl: { label: 'App Store', icon: AppWindow },
  steamUrl: { label: 'Steam', icon: Gamepad2 },
};


const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  imageUrl?: string | null;
  href?: string;
}> = ({ icon: Icon, label, value, imageUrl, href }) => {
  if (!value && !imageUrl && !href) return null;

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
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex flex-col">
        <p className="font-semibold text-sm">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
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

export const MediaInfoTemplate = ({ figure }: { figure: Figure }) => {
    const releaseDateFormatted = React.useMemo(() => {
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

    const nationalityFlagUrl = React.useMemo(() => {
      if (!figure.nationalityCode) return null;
      return `https://flagcdn.com/w40/${figure.nationalityCode.toLowerCase()}.png`;
    }, [figure.nationalityCode]);

    const socialLinksArray = Object.entries(figure.socialLinks || {}).filter(([, link]) => !!link);
    const hasSocialLinks = socialLinksArray.length > 0;
    const hasHashtags = figure.hashtags && figure.hashtags.length > 0;

    return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {figure.mediaSubcategory === 'video_game' && (
                <>
                    <InfoItem icon={UserCircle} label="Desarrollador" value={figure.developer} />
                    <InfoItem icon={Building} label="Editor" value={figure.publisher} />
                    <InfoItem icon={Clapperboard} label="Género" value={figure.mediaGenre} />
                </>
            )}

            <InfoItem icon={Cake} label="Fecha de Lanzamiento" value={releaseDateFormatted} />
            <InfoItem icon={Globe} label="País de Origen" value={figure.nationality} href={figure.nationalityCode ? `/figures/nationality/${figure.nationalityCode}`: undefined} imageUrl={nationalityFlagUrl} />
            
            {(figure.mediaSubcategory === 'movie' || figure.mediaSubcategory === 'series' || figure.mediaSubcategory === 'anime') && (
                <>
                    <InfoItem icon={Clapperboard} label="Género" value={figure.mediaGenre} />
                    <InfoItem icon={UserCircle} label="Director" value={figure.director} />
                    <InfoItem icon={Building} label="Estudio" value={figure.studio} />
                </>
            )}

            {figure.mediaSubcategory === 'video_game' && (
                 <InfoItem icon={Gamepad2} label="Plataformas" value={figure.platforms?.join(', ')} />
            )}
            
            {(figure.mediaSubcategory === 'book' || figure.mediaSubcategory === 'manga_comic' || figure.mediaSubcategory === 'board_game') && (
                <>
                    <InfoItem icon={UserCircle} label="Autor/Escritor" value={figure.author} />
                    <InfoItem icon={MonitorPlay} label="Artista/Dibujante" value={figure.artist} />
                </>
            )}
            {(figure.mediaSubcategory === 'company' || figure.mediaSubcategory === 'website' || figure.mediaSubcategory === 'social_media_platform') && (
                <>
                    <InfoItem icon={UserCircle} label="Fundador" value={figure.founder} />
                    <InfoItem icon={Briefcase} label="Industria" value={figure.industry} />
                    <InfoItem icon={LinkIcon} label="Sitio Web" value={figure.websiteUrl} href={figure.websiteUrl} />
                </>
            )}
            {figure.mediaSubcategory === 'animal' && (
                <InfoItem icon={PawPrint} label="Especie" value={figure.species} />
            )}

            {hasSocialLinks && (
                 <div className="md:col-span-2 lg:col-span-3">
                   <Separator className="my-4"/>
                   <h3 className="font-headline text-base mb-4">Redes y Enlaces de Compra</h3>
                   <div className="flex items-center gap-6 flex-wrap">
                       {Object.entries(figure.socialLinks || {}).map(([key, link]) => {
                         const config = SOCIAL_MEDIA_CONFIG[key as keyof typeof SOCIAL_MEDIA_CONFIG];
                         return link && config ? <SocialLink key={key} href={link} label={config.label} icon={config.icon} /> : null;
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
