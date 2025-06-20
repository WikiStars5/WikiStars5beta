
"use client"; 

import Link from 'next/link';
import Image from 'next/image'; 

interface LogoProps {
  className?: string;
  theme: 'light' | 'dark'; 
}

const logoLightUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194";
const logoDarkUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogonoche.png?alt=media&token=0ab973fd-2ec0-44a3-aef0-82850db98096";

// Define la relación de aspecto de tus logos. Si son diferentes, podrías necesitar lógica adicional.
// Asumamos que el logo es, por ejemplo, 100px de ancho por 25px de alto (relación 4:1).
const LOGO_ASPECT_RATIO_WIDTH = 100;
const LOGO_ASPECT_RATIO_HEIGHT = 25;


export function Logo({ className, theme }: LogoProps) {
  const currentLogoUrl = theme === 'light' ? logoLightUrl : logoDarkUrl;
  const desiredContainerHeight = 28; // 28px (h-7)

  return (
    <Link href="/" className={`inline-flex items-end gap-2 ${className}`}>
      <div 
        className="relative" 
        style={{ 
          height: `${desiredContainerHeight}px`, 
          width: `${(desiredContainerHeight * LOGO_ASPECT_RATIO_WIDTH) / LOGO_ASPECT_RATIO_HEIGHT}px` 
        }}
        data-ai-hint="logo brand"
      >
        <Image
          src={currentLogoUrl}
          alt="WikiStars5 Logo"
          fill // 'fill' es bueno si el div padre tiene dimensiones definidas.
          className="object-contain" // object-contain mantendrá la relación de aspecto dentro del div.
          priority 
        />
      </div>
      <span className="text-xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
