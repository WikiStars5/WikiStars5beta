
'use server';
/**
 * @fileOverview A flow to verify a character on famousbirthdays.com and extract their main image.
 *
 * - verifyFamousBirthdaysCharacter - A function that handles the verification process.
 * - FamousBirthdaysVerificationInput - The input type for the function.
 * - FamousBirthdaysVerificationOutput - The return type for the function.
 */

import { z } from 'zod';
import fetch from 'node-fetch';

const FamousBirthdaysVerificationInputSchema = z.object({
  name: z.string().describe('The name of the public figure to verify.'),
  url: z.string().url().describe('The full URL of their profile on es.famousbirthdays.com.'),
});
export type FamousBirthdaysVerificationInput = z.infer<typeof FamousBirthdaysVerificationInputSchema>;

const FamousBirthdaysVerificationOutputSchema = z.object({
  found: z.boolean().describe('Whether the page was valid and contained the name.'),
  title: z.string().describe('The name of the character as found on the page.'),
  imageUrl: z.string().nullable().describe('The URL of the main image from the page, if found.'),
});
export type FamousBirthdaysVerificationOutput = z.infer<typeof FamousBirthdaysVerificationOutputSchema>;


// A simple regex to find the main profile picture URL in the HTML.
// This is brittle and might break if the site changes its structure.
const imageUrlRegex = /<div class="bio-module-image-wrapper">[\s\S]*?<img src="([^"]+)"/;
// A regex to find the name in a prominent h1 tag.
const nameRegex = /<h1 class="font-bold text-5xl mb-2">([^<]+)<\/h1>/;

export async function verifyFamousBirthdaysCharacter(
  input: FamousBirthdaysVerificationInput
): Promise<FamousBirthdaysVerificationOutput> {
  try {
    // 1. Validate the URL format
    if (!input.url.startsWith('https://es.famousbirthdays.com/people/')) {
        throw new Error("La URL debe ser de 'es.famousbirthdays.com/people/'.");
    }

    // 2. Fetch the page content
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`La página no se pudo encontrar (código: ${response.status}). Verifica la URL.`);
    }
    const html = await response.text();

    // 3. Check if the character's name is in the HTML content (case-insensitive)
    const normalizedHtml = html.toLowerCase();
    const normalizedName = input.name.toLowerCase();
    if (!normalizedHtml.includes(normalizedName)) {
      throw new Error(`El nombre "${input.name}" no se encontró en el contenido de la página.`);
    }
    
    // 4. Extract the title and image URL using regex
    const nameMatch = html.match(nameRegex);
    const title = nameMatch ? nameMatch[1].trim() : input.name; // Fallback to input name

    const imageMatch = html.match(imageUrlRegex);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    return {
      found: true,
      title: title,
      imageUrl: imageUrl,
    };

  } catch (error: any) {
    console.error(`FamousBirthdays flow failed for name "${input.name}":`, error);
    return {
      found: false,
      title: '',
      imageUrl: null,
    };
  }
}
