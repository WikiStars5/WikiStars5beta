"use client";

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
}

const logoLightUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194";
const logoDarkUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogonoche.png?alt=media&token=0ab973fd-2ec0-44a3-aef0-82850db98096";

const LOGO_INTRINSIC_WIDTH = 200;
const LOGO_INTRINSIC_HEIGHT = 50;

export function Logo({ className }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLogoUrl = resolvedTheme === 'dark' ? logoDarkUrl : logoLightUrl;

  return (
    <Link href="/" className={cn("inline-flex items-end gap-2", className)}>
      <Image
        src={mounted ? currentLogoUrl : logoLightUrl}
        alt="WikiStars5 Logo"
        width={LOGO_INTRinsIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        className="h-7 w-auto object-contain"
        priority
        data-ai-hint="logo brand"
      />
      <span className="text-xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
