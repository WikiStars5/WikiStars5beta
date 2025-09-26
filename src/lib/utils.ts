
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type DocumentReference } from 'firebase/firestore';

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

export function timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "justo ahora";
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} min`;
    return `hace ${Math.floor(seconds)} seg`;
}

// Helper function to recursively find the root comment reference
export const findRootCommentRef = (ref: DocumentReference): DocumentReference | null => {
    // A root comment's path is `figures/{figureId}/comments/{commentId}` which has 4 segments.
    // A reply's path is longer, e.g., `.../comments/{commentId}/replies/{replyId}` (6 segments).
    if (!ref.parent) return null;
    const segments = ref.path.split('/');
    if (segments.length === 4 && segments[2] === 'comments') {
        return ref;
    }
    // If it's a reply or deeper, its parent's parent is the document it's a reply to.
    if (ref.parent.parent) {
        return findRootCommentRef(ref.parent.parent);
    }
    return null;
};
