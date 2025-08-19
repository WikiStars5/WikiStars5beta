"use client";

import type { Figure } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpen,
  Cake,
  MapPin,
  Activity,
  HeartHandshake,
  StretchVertical,
  Scale,
  Palette,
  Eye,
  Scan,
  NotepadText,
  Zap,
  UserCircle,
  Briefcase,
  Globe,
  Users,
} from "lucide-react";
import type { User } from 'firebase/auth';

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

export function FigureInfo({ figure, currentUser }: FigureInfoProps) {
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

  const hasAnyInfo = hasBasicInfo || hasDetailedInfo || hasPhysicalInfo;

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Información Detallada</CardTitle>
        <CardDescription>
          Datos biográficos y descriptivos de {figure.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyInfo ? (
           <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">No hay información detallada disponible para esta figura.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
      </CardContent>
    </Card>
  );
}
