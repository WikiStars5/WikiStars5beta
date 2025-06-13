import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-7 w-7">
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
          <path 
            id="wikistars5-starShape" 
            d="M0,-7.5 L2.2,-2.3 L7.1,-2.0 L3.4,1.4 L4.5,6.2 L0,4 L-4.5,6.2 L-3.4,1.4 L-7.1,-2.0 L-2.2,-2.3 Z" 
            fill="#FFEB3B"
            stroke="#B0C4DE"
            strokeWidth="1"
          />
        </defs>
        <use href="#wikistars5-starShape" transform="translate(50, 22)" /> 
        <use href="#wikistars5-starShape" transform="translate(25, 42) rotate(-10)" /> 
        <use href="#wikistars5-starShape" transform="translate(75, 42) rotate(10)" />
        <use href="#wikistars5-starShape" transform="translate(32, 78) rotate(-20)" /> 
        <use href="#wikistars5-starShape" transform="translate(68, 78) rotate(20)" />
      </svg>
      <span className="text-2xl font-bold font-headline text-primary">
        WikiStars5
      </span>
    </Link>
  );
}
