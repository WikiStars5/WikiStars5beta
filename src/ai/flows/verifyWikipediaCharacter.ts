
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
    
    // 2. Get the main image from the page
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
