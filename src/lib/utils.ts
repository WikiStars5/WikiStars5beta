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
  let correctedUrl = url;
  if (correctedUrl.startsWith('http:/') && !correctedUrl.startsWith('http://')) {
    correctedUrl = correctedUrl.replace('http:/', 'http://');
  }
  if (correctedUrl.startsWith('https:/') && !correctedUrl.startsWith('https://')) {
    correctedUrl = correctedUrl.replace('https:/', 'https://');
  }
  return correctedUrl;
}
