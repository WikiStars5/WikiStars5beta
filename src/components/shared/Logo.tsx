import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-9 w-9">
        <text
          x="50"
          y="70"
          fontFamily="serif"
          fontSize="60"
          fontWeight="bold"
          textAnchor="middle"
          fill="#000000"
        >
          W
        </text>
        <defs>
          {/* Scaled star path for a slightly larger/fatter star */}
          <path
            id="wikistars5-starShape"
            d="M0,-9 L2.6,-2.8 L8.5,-2.4 L4.1,1.7 L5.4,7.4 L0,4.8 L-5.4,7.4 L-4.1,1.7 L-8.5,-2.4 L-2.6,-2.8 Z"
            fill="#FFEB3B"
            stroke="#B0C4DE"
            strokeWidth="1"
          />
        </defs>
        {/* Adjusted star positions */}
        <use href="#wikistars5-starShape" transform="translate(50, 18)" />
        <use href="#wikistars5-starShape" transform="translate(18, 48)" />
        <use href="#wikistars5-starShape" transform="translate(82, 48)" />
        <use href="#wikistars5-starShape" transform="translate(28, 82)" />
        <use href="#wikistars5-starShape" transform="translate(72, 82)" />
      </svg>
      <span className="text-2xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
