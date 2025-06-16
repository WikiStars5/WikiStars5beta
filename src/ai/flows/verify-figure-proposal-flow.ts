
'use server';
/**
 * @fileOverview A Genkit flow to verify a new figure proposal.
 *
 * - verifyFigureProposal - A function that calls the Genkit flow to verify the proposal.
 * - VerifyFigureProposalInput - The input type for the verifyFigureProposal function.
 * - VerifyFigureProposalOutput - The return type for the verifyFigureProposal function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const VerifyFigureProposalInputSchema = z.object({
  figureName: z.string().describe('The name of the public figure being proposed.'),
  proposedWikiLink: z.string().url({ message: "El enlace proporcionado no es una URL válida." })
    .describe('The Wikipedia or Fandom link provided for verification.'),
});
export type VerifyFigureProposalInput = z.infer<typeof VerifyFigureProposalInputSchema>;

export const VerifyFigureProposalOutputSchema = z.object({
  isValidProposal: z.boolean().describe('Whether the proposal (link and domain) is considered valid based on initial checks.'),
  message: z.string().describe('A message detailing the verification result or any errors.'),
  // Future fields: extractedTitle, extractedDescription, nameMatchesContent
});
export type VerifyFigureProposalOutput = z.infer<typeof VerifyFigureProposalOutputSchema>;

// This is the exported wrapper function that frontend/server actions will call.
export async function verifyFigureProposal(input: VerifyFigureProposalInput): Promise<VerifyFigureProposalOutput> {
  return verifyFigureProposalFlow(input);
}

// Placeholder for a more complex prompt if AI was used for advanced content checking
const verificationPrompt = ai.definePrompt({
    name: 'verifyFigureProposalPrompt',
    input: { schema: VerifyFigureProposalInputSchema },
    output: { schema: VerifyFigureProposalOutputSchema },
    prompt: `Based on the proposed figure name "{{figureName}}" and the link "{{proposedWikiLink}}", determine if this is a valid proposal.
    For now, only check if the link is from wikipedia.org or fandom.com.
    Respond with isValidProposal and a message.`,
});


const verifyFigureProposalFlow = ai.defineFlow(
  {
    name: 'verifyFigureProposalFlow',
    inputSchema: VerifyFigureProposalInputSchema,
    outputSchema: VerifyFigureProposalOutputSchema,
  },
  async (input) => {
    // Basic validation (already done in form, but good to have here too)
    if (!input.figureName || input.figureName.trim().length < 2) {
      return { isValidProposal: false, message: 'El nombre de la figura es demasiado corto.' };
    }
    if (!input.proposedWikiLink) {
      return { isValidProposal: false, message: 'El enlace a Wikipedia/Fandom es obligatorio.' };
    }

    try {
      const url = new URL(input.proposedWikiLink);
      const hostname = url.hostname.toLowerCase();
      
      const allowedDomains = ['wikipedia.org', 'fandom.com'];
      const isAllowedDomain = allowedDomains.some(domain => hostname.endsWith(domain));

      if (!isAllowedDomain) {
        return { 
          isValidProposal: false, 
          message: 'El enlace debe ser de un dominio de Wikipedia (ej. es.wikipedia.org) o Fandom (ej. nombre.fandom.com).' 
        };
      }

      // TODO - Future advanced verification steps:
      // 1. Fetch content from proposedWikiLink (handle errors, redirects).
      //    - Use Wikipedia API for *.wikipedia.org links for structured data.
      //    - For *.fandom.com, might need to scrape or look for OpenGraph/Schema.org tags.
      // 2. Check for 404s, disambiguation pages.
      // 3. Extract title and possibly a summary from the article.
      // 4. Use an LLM prompt (e.g., using 'verificationPrompt' with more complex logic) to:
      //    - Compare input.figureName with the extracted article title/content.
      //    - Determine if they refer to the same public figure.
      //    - Set 'isValidProposal' based on this more advanced check.
      //    - Provide a more detailed 'message'.
      // For now, basic domain check is sufficient for 'isValidProposal: true'

      return { 
        isValidProposal: true, 
        message: 'El enlace proporcionado es de un dominio permitido (Wikipedia/Fandom). La verificación avanzada de contenido se realizará en una etapa futura.' 
      };

    } catch (error) {
      // Catches invalid URL format error from new URL()
      return { isValidProposal: false, message: 'El enlace proporcionado no es una URL válida.' };
    }
  }
);
