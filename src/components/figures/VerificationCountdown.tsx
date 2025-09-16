
"use client";

import { useState, useEffect } from 'react';
import { type Timestamp } from 'firebase/firestore';
import { differenceInMilliseconds } from 'date-fns';
import { Hourglass } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationCountdownProps {
  expiresAt: Timestamp | { _seconds: number; _nanoseconds: number };
}

const calculateTimeLeft = (expirationDate: Date): { total: number; days: number; hours: number; minutes: number; seconds: number } | null => {
    const now = new Date();
    const difference = differenceInMilliseconds(expirationDate, now);

    if (difference <= 0) {
        return null;
    }

    return {
        total: difference,
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
};

// Helper function to safely convert various timestamp formats to a Date object
const toDate = (timestamp: VerificationCountdownProps['expiresAt']): Date => {
  if (!timestamp) return new Date(0); // Return an invalid date if no timestamp
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if ('_seconds' in timestamp && typeof timestamp._seconds === 'number') {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  // Fallback for ISO string or other formats Date can parse
  try {
    const parsedDate = new Date(timestamp as any);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  } catch (e) {
    // ignore
  }
  return new Date(0); // Return an invalid date on failure
};


export function VerificationCountdown({ expiresAt }: VerificationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expirationDate = toDate(expiresAt);
    if (isNaN(expirationDate.getTime()) || expirationDate.getTime() === 0) {
        setIsExpired(true);
        return;
    }

    // Set initial value on client mount
    setTimeLeft(calculateTimeLeft(expirationDate));

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(expirationDate);
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      } else {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (isExpired) {
    return (
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30">
              <Hourglass className="h-4 w-4" />
              <span>Periodo finalizado</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>El periodo de verificación comunitaria ha terminado.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const format = (num: number) => num.toString().padStart(2, '0');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/30">
            <Hourglass className="h-4 w-4 animate-spin" style={{ animationDuration: '5s' }} />
             {timeLeft ? (
                <span>
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {format(timeLeft.hours)}:{format(timeLeft.minutes)}:{format(timeLeft.seconds)}
                </span>
             ) : (
                <span>Calculando...</span>
             )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tiempo restante para la verificación comunitaria.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
