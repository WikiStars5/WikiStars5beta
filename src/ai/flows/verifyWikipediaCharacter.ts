
'use server';
/**
 * @fileOverview A flow to verify a CHARACTER on Wikipedia and extract their main image.
 * This flow validates the presence of a character-specific infobox by checking the wikitext source.
 */

import { z } from 'zod';
import fetch from 'node-fetch';

const WikipediaVerificationInputSchema = z.object({
  name: z.string().describe('The name of the public figure or character to verify.'),
});
export type WikipediaVerificationInput = z.infer<typeof WikipediaVerificationInputSchema>;

const WikipediaVerificationOutputSchema = z.object({
  found: z.boolean().describe('Whether a Wikipedia page was found for the character.'),
  title: z.string().describe('The exact title of the Wikipedia page found.'),
  imageUrl: z.string().nullable().describe('The URL of the main image from the Wikipedia page, if found.'),
  verificationError: z.string().nullable().describe('Reason why verification failed.'),
});
export type WikipediaVerificationOutput = z.infer<typeof WikipediaVerificationOutputSchema>;

// --- String Similarity Logic ---

/**
 * Calculates a similarity score between 0 and 1 using Jaro-Winkler.
 */
function JaroWinkler(s1: string, s2: string): number {
    let m = 0;
    if (s1.length === 0 || s2.length === 0) return 0;
    if (s1.length > s2.length) [s1, s2] = [s2, s1];

    const range = Math.floor(s2.length / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - range);
        const end = Math.min(i + range + 1, s2.length);
        for (let j = start; j < end; j++) {
            if (s2Matches[j]) continue;
            if (s1.charAt(i) !== s2.charAt(j)) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            m++;
            break;
        }
    }

    if (m === 0) return 0;

    let k = 0, t = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1.charAt(i) !== s2.charAt(k)) t++;
        k++;
    }
    t /= 2;

    const jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3;

    let p = 0.1, l = 0;
    if (jaro > 0.7) {
        while (s1.charAt(l) === s2.charAt(l) && l < 4) l++;
        return jaro + l * p * (1 - jaro);
    }
    return jaro;
}

// --- API and Flow Logic ---

async function callWikipediaApi(params: Record<string, string>): Promise<any> {
    const endpoint = 'https://es.wikipedia.org/w/api.php';
    const url = new URL(endpoint);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    url.searchParams.append('format', 'json');
    url.searchParams.append('origin', '*'); // CORS

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Wikipedia API responded with status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error calling Wikipedia API:", error);
        throw new Error("Could not connect to Wikipedia API.");
    }
}

// Stricter keywords for character verification
const CHARACTER_KEYWORDS = [
    'nacimiento', 'información personal',
];


export async function verifyWikipediaCharacter(
  input: WikipediaVerificationInput
): Promise<WikipediaVerificationOutput> {
  try {
    // 1. Search for the page to get the exact title
    const searchResult = await callWikipediaApi({
      action: 'query',
      list: 'search',
      srsearch: input.name,
      srlimit: '1',
      srprop: '',
    });

    if (!searchResult.query.search.length) {
      return { found: false, title: '', imageUrl: null, verificationError: 'No se encontró ninguna página en Wikipedia con ese nombre.' };
    }

    const pageTitle = searchResult.query.search[0].title;
    
    // 2. Validate similarity between input name and found title
    const similarityScore = JaroWinkler(input.name.toLowerCase(), pageTitle.toLowerCase());
    if (similarityScore < 0.7) {
        return { found: false, title: '', imageUrl: null, verificationError: `El nombre encontrado ("${pageTitle}") no es suficientemente similar al que buscaste.` };
    }

    // 3. Fetch the raw wikitext of the page
    const contentResult = await callWikipediaApi({
        action: 'parse',
        page: pageTitle,
        prop: 'wikitext',
        formatversion: '2',
    });
    
    const wikitext = contentResult.parse.wikitext;
    
    if (!wikitext) {
      return { found: false, title: pageTitle, imageUrl: null, verificationError: 'No se pudo obtener el contenido de la página de Wikipedia.' };
    }
    
    // 4. Check the wikitext for any infobox template ({{Ficha...}})
    const infoboxRegex = /\{\{\s*(Ficha de [^\n{]+|Infobox [^\n{]+)/i;
    const infoboxMatch = wikitext.match(infoboxRegex);

    if (!infoboxMatch) {
        return { found: false, title: pageTitle, imageUrl: null, verificationError: 'El artículo no contiene un cuadro de información (Ficha/Infobox), por lo que no puede ser validado.' };
    }
    
    // To get the full infobox content, we need to find the matching closing braces `}}`
    // This is a simplified approach; a full parser would handle nested braces.
    let braceCount = 0;
    let infoboxContent = '';
    const startIndex = wikitext.indexOf(infoboxMatch[0]);

    if (startIndex !== -1) {
        const relevantText = wikitext.substring(startIndex);
        let currentIndex = 0;
        for (const char of relevantText) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            infoboxContent += char;
            currentIndex++;
            if (braceCount === 0) break;
        }
    }
    
    // 5. Check for CHARACTER keywords within the isolated infobox wikitext
    const contentToSearch = infoboxContent.toLowerCase();
    const hasKeywords = CHARACTER_KEYWORDS.some(keyword => contentToSearch.includes(keyword));
    
    if (!hasKeywords) {
        return { found: false, title: pageTitle, imageUrl: null, verificationError: `El cuadro de información no contiene datos de un personaje (ej: "${CHARACTER_KEYWORDS[0]}").` };
    }


    // 6. Get the main image from the page (if all checks passed)
    const imageResult = await callWikipediaApi({
        action: 'query',
        titles: pageTitle,
        prop: 'pageimages',
        pithumbsize: '500', // Request a decent size thumbnail
        piprop: 'thumbnail|original'
    });
    
    const pages = imageResult.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    let imageUrl: string | null = null;
    if (page.thumbnail) {
      // Prefer original size if available, fallback to thumbnail
      imageUrl = page.original ? page.original.source : page.thumbnail.source;
    }

    return {
      found: true,
      title: pageTitle,
      imageUrl: imageUrl,
      verificationError: null,
    };

  } catch (error: any) {
    console.error(`Wikipedia character flow failed for name "${input.name}":`, error);
    return {
      found: false,
      title: '',
      imageUrl: null,
      verificationError: error.message || "Ocurrió un error inesperado durante la verificación.",
    };
  }
}
