
'use server';
/**
 * @fileOverview A flow to verify a character on Wikipedia and extract their main image.
 *
 * - verifyWikipediaCharacter - A function that handles the verification process.
 * - WikipediaVerificationInput - The input type for the function.
 * - WikipediaVerificationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
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
});
export type WikipediaVerificationOutput = z.infer<typeof WikipediaVerificationOutputSchema>;

// --- String Similarity Logic ---

/**
 * Calculates the Levenshtein distance between two strings.
 * The Levenshtein distance is the number of edits (insertions, deletions, substitutions)
 * required to change one word into the other.
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = new Array(bn + 1);
  for (let i = 0; i <= bn; ++i) {
    matrix[i] = new Array(an + 1);
  }
  for (let i = 0; i <= an; ++i) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= bn; ++j) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= bn; ++j) {
    for (let i = 1; i <= an; ++i) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates a similarity score between 0 and 1.
 * A score of 1 means the strings are identical.
 * A score of 0 means they are completely different.
 */
function JaroWinkler(s1: string, s2: string): number {
    let m = 0;

    // Exit early if either string is null or empty.
    if (s1.length === 0 || s2.length === 0) {
        return 0;
    }
    
    // Ensure s1 is the shorter string.
    if (s1.length > s2.length) {
        let temp = s1;
        s1 = s2;
        s2 = temp;
    }

    let range = Math.floor(s2.length / 2) - 1;
    let s1_matches = new Array(s1.length).fill(false);
    let s2_matches = new Array(s2.length).fill(false);
    
    for (let i = 0; i < s1.length; i++) {
        let start = Math.max(0, i - range);
        let end = Math.min(i + range + 1, s2.length);

        for (let j = start; j < end; j++) {
            if (s2_matches[j]) continue;
            if (s1.charAt(i) !== s2.charAt(j)) continue;
            s1_matches[i] = true;
            s2_matches[j] = true;
            m++;
            break;
        }
    }
    
    if (m === 0) return 0;
    
    let k = 0;
    let t = 0;
    
    for (let i = 0; i < s1.length; i++) {
        if (!s1_matches[i]) continue;
        while (!s2_matches[k]) k++;
        if (s1.charAt(i) !== s2.charAt(k)) t++;
        k++;
    }
    
    t = t / 2;
    
    let jaro_dist = (m / s1.length + m / s2.length + (m - t) / m) / 3;

    // Winkler bonus
    let p = 0.1;
    let l = 0;
    
    if (jaro_dist > 0.7) {
        while (s1.charAt(l) === s2.charAt(l) && l < 4) {
            l++;
        }
        jaro_dist = jaro_dist + l * p * (1 - jaro_dist);
    }
    
    return jaro_dist;
}

// --- API and Flow Logic ---

async function callWikipediaApi(params: Record<string, string>): Promise<any> {
    const endpoint = 'https://es.wikipedia.org/w/api.php';
    const url = new URL(endpoint);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    url.searchParams.append('format', 'json');

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
      return { found: false, title: '', imageUrl: null };
    }

    const pageTitle = searchResult.query.search[0].title;
    
    // 2. Validate similarity between input name and found title
    const normalizedInputName = input.name.toLowerCase();
    const normalizedPageTitle = pageTitle.toLowerCase();
    const similarityScore = JaroWinkler(normalizedInputName, normalizedPageTitle);
    
    // We set a threshold. 0.7 is a reasonable starting point.
    // This allows for minor misspellings but rejects completely different names.
    if (similarityScore < 0.7) {
        console.log(`Verification failed: Similarity score between "${input.name}" and "${pageTitle}" is too low (${similarityScore.toFixed(2)}).`);
        return { found: false, title: '', imageUrl: null };
    }

    // 3. Get the main image from the page
    const imageResult = await callWikipediaApi({
        action: 'query',
        titles: pageTitle,
        prop: 'pageimages',
        pithumbsize: '500', // Request a reasonably sized thumbnail
        piprop: 'thumbnail|original'
    });
    
    const pages = imageResult.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    let imageUrl: string | null = null;
    if (page.thumbnail) {
      // The 'original' property provides a better quality URL than 'thumbnail.source'
      imageUrl = page.original ? page.original.source : page.thumbnail.source;
    }

    return {
      found: true,
      title: pageTitle,
      imageUrl: imageUrl,
    };
  } catch (error: any) {
    console.error(`Wikipedia flow failed for name "${input.name}":`, error);
    // Return a structured error response that the client can handle
    return {
      found: false,
      title: '',
      imageUrl: null,
    };
  }
}
