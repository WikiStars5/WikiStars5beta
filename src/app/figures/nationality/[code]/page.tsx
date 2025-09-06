
import { getFiguresByNationality } from "@/lib/placeholder-data";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe } from "lucide-react";
import type { Metadata } from 'next';
import { countryCodeToNameMap } from '@/config/countries';
import Image from 'next/image';

interface NationalityPageProps {
  params: { code: string };
}

export async function generateMetadata({ params }: NationalityPageProps): Promise<Metadata> {
  const countryCode = params.code.toUpperCase();
  const countryName = countryCodeToNameMap.get(countryCode) || "País Desconocido";
  return {
    title: `Figuras de ${countryName}`,
    description: `Explora todas las figuras públicas de ${countryName} en WikiStars5.`,
    alternates: {
      canonical: `/figures/nationality/${params.code}`,
    },
  };
}

export default async function NationalityPage({ params }: NationalityPageProps) {
  const { code } = params;
  const countryCode = code.toUpperCase();
  const countryName = countryCodeToNameMap.get(countryCode) || "País Desconocido";
  const figures = await getFiguresByNationality(countryCode);
  const flagUrl = `https://flagcdn.com/w160/${code.toLowerCase()}.png`;

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="flex flex-col justify-center items-center gap-3">
             <Image
                src={flagUrl}
                alt={`Bandera de ${countryName}`}
                width={120}
                height={80}
                className="w-30 h-auto rounded-md shadow-lg"
                data-ai-hint="country flag"
             />
             <h1 className="text-4xl font-bold font-headline">{countryName}</h1>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          {figures.length} {figures.length === 1 ? 'perfil encontrado' : 'perfiles encontrados'} de esta nacionalidad.
        </p>
      </section>

      {figures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {figures.map((figure) => (
            <FigureListItem key={figure.id} figure={figure} />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertTitle>No se encontraron resultados</AlertTitle>
          <AlertDescription>
            No hay perfiles que coincidan con la nacionalidad "{countryName}".
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
