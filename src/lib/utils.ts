import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Corrects malformed URLs that might have http:/ or https:/ instead of http:// or https://.
 * This is a safeguard against data entry errors.
 * @param url The URL string to correct.
 * @returns The corrected URL string, or an empty string if the input is null/undefined.
 */
export function correctMalformedUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }
  let correctedUrl = url.trim();
  
  if (correctedUrl.startsWith('http:/') && !correctedUrl.startsWith('http://')) {
    correctedUrl = 'http://' + correctedUrl.substring(6);
  } else if (correctedUrl.startsWith('https:/') && !correctedUrl.startsWith('https://')) {
    correctedUrl = 'https://' + correctedUrl.substring(7);
  }
  
  return correctedUrl;
}
