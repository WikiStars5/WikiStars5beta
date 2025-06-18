
"use client"; // Required if we use hooks like useEffect, but for simple prop drilling it might not be if Image is optimized. Let's make it client for theme prop.

import Link from 'next/link';
import Image from 'next/image'; // Import next/image

interface LogoProps {
  className?: string;
  theme: 'light' | 'dark'; // Add theme prop
}

const logoLightUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194";
const logoDarkUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogonoche.png?alt=media&token=0ab973fd-2ec0-44a3-aef0-82850db98096";

export function Logo({ className, theme }: LogoProps) {
  const currentLogoUrl = theme === 'light' ? logoLightUrl : logoDarkUrl;

  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-7 w-auto" style={{ minWidth: '28px' }}> {/* Container height h-7 (28px) */}
        <Image
          src={currentLogoUrl}
          alt="WikiStars5 Logo"
          height={20} // Image height 20px
          width={80}  // Adjusted width proportionally (4:1 aspect ratio)
          className="object-contain" // Ensures the image scales within the bounds
          priority // Logo is important, consider priority loading
          data-ai-hint="logo brand"
        />
      </div>
      <span className="text-xl font-bold font-headline text-primary"> {/* Text size text-xl */}
        WikiStars5
      </span>
    </Link>
  );
}
