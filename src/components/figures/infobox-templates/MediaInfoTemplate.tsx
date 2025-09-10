
"use client";

import * as React from 'react';
import type { Figure } from "@/lib/types";
import {
  Cake, Link as LinkIcon, Gamepad2, Clapperboard, MonitorPlay, Building, Book, Tag, PawPrint, UserCircle, Briefcase
} from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FigureTags } from '../FigureTags';
import { Separator } from '@/components/ui/separator';

const SOCIAL_MEDIA_CONFIG = {
  website: { label: 'Página Web', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fwebsite.png?alt=media&token=c1a3b1a5-7a0c-4734-9430-675e2f75fdc2' },
  instagram: { label: 'Instagram', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Finstagram.png?alt=media&token=91707034-56b6-411f-9504-9273dd0f8b64' },
  twitter: { label: 'X (Twitter)', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ftwitter.webp?alt=media&token=492950d1-1987-48f0-a149-02290cfa1ffc' },
  youtube: { label: 'YouTube', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fyoutube.png?alt=media&token=8952da33-736f-4718-b6d9-fcc99dd93111' },
  facebook: { label: 'Facebook', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ffacebook.png?alt=media&token=100d82e3-e8fe-4f84-96a2-79a23fed43b4' },
  tiktok: { label: 'TikTok', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Ftiktok.png?alt=media&token=87f84943-a74c-4916-9a2c-c4a2b3451cbc' },
  linkedin: { label: 'LinkedIn', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flinkedin.png?alt=media&token=cdc7c2b8-e71a-47de-b261-b44b96f5bf0a' },
  discord: { label: 'Discord', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Fdiscord.png?alt=media&token=dbb8b8d1-c5d8-4673-b91f-25b1d796195c' },
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

    const socialLinksArray = Object.entries(figure.socialLinks || {}).filter(([, link]) => !!link);
    const hasSocialLinks = socialLinksArray.length > 0;
    const hasTags = figure.tags && figure.tags.length > 0;

    return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <InfoItem icon={Clapperboard} label="Género" value={figure.mediaGenre} />
            <InfoItem icon={Cake} label="Fecha de Lanzamiento" value={releaseDateFormatted} />
            
            {(figure.mediaSubcategory === 'movie' || figure.mediaSubcategory === 'series' || figure.mediaSubcategory === 'anime') && (
                <>
                    <InfoItem icon={UserCircle} label="Director" value={figure.director} />
                    <InfoItem icon={Building} label="Estudio" value={figure.studio} />
                </>
            )}
            {figure.mediaSubcategory === 'video_game' && (
                <>
                    <InfoItem icon={UserCircle} label="Desarrollador" value={figure.developer} />
                    <InfoItem icon={Gamepad2} label="Plataformas" value={figure.platforms?.join(', ')} />
                </>
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
                   <h3 className="font-headline text-base mb-4">Redes Sociales</h3>
                   <div className="flex items-center gap-6 flex-wrap">
                      {Object.entries(SOCIAL_MEDIA_CONFIG).map(([key, { label, imageUrl }]) => {
                        const link = (figure.socialLinks as Record<string, string> | undefined)?.[key];
                        return link ? <SocialLink key={key} href={link} imageUrl={imageUrl} label={label} /> : null;
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
