
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Rocket, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Apoya el Futuro de WikiStars5 - Crowdfunding',
  description: 'Ayúdanos a construir la versión completa de WikiStars5. Descubre nuestra visión y únete a nuestra campaña de crowdfunding.',
  alternates: {
    canonical: "/crowdfunding",
  },
};

export default function CrowdfundingPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <header className="text-center mb-12">
        <Rocket className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Apoya el Futuro de <span className="text-primary">WikiStars5</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Juntos podemos construir la plataforma definitiva de percepción pública.
        </p>
      </header>

      <Card className="mb-12 bg-card/50">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Un Prototipo Nacido de la Inteligencia Artificial</CardTitle>
        </CardHeader>
        <CardContent className="text-base text-center text-foreground/80 space-y-4">
          <p>
            La página que estás explorando es un **prototipo funcional creado al 100% con asistencia de IA**. Fue diseñado para demostrar la idea central de WikiStars5: una plataforma interactiva y abierta para medir y debatir la percepción de figuras públicas.
          </p>
          <p>
            Aunque es funcional, es solo el comienzo. Nuestro objetivo es usar este prototipo para lanzar una campaña de crowdfunding y recaudar los fondos necesarios para construir la versión completa y robusta que nuestra comunidad merece.
          </p>
        </CardContent>
      </Card>

      <section className="mb-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-8">Nuestra Visión para la Versión Completa</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Comunidad y Gamificación"
            description="Perfiles de usuario avanzados, logros, insignias por rachas y un sistema de reputación para fomentar la participación de calidad."
          />
          <FeatureCard
            icon={<Rocket className="h-8 w-8 text-primary" />}
            title="Aplicaciones Móviles"
            description="Apps nativas para iOS y Android para que puedas calificar y debatir desde cualquier lugar, con notificaciones push personalizadas."
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8 text-primary" />}
            title="Más Categorías y Verificación"
            description="Ampliar las categorías, incluir más figuras y un sistema de verificación de datos para asegurar la precisión de la información."
          />
        </div>
      </section>

      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-4">¡Únete a Nuestra Misión!</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Tu apoyo es crucial para hacer de WikiStars5 una realidad. Visita nuestra campaña para contribuir.
        </p>
        <Button size="lg" className="text-lg font-bold py-6 px-10" asChild>
          {/* Reemplaza '#' con el enlace real a tu campaña de Kickstarter, GoFundMe, etc. */}
          <Link href="#" target="_blank" rel="noopener noreferrer">
            <Rocket className="mr-3 h-6 w-6" />
            Apoyar en Kickstarter
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg text-center shadow-md hover:shadow-xl transition-shadow">
      <div className="mb-4 inline-block p-3 bg-primary/10 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-headline mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
