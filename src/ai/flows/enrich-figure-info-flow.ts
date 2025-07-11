
'use server';
/**
 * @fileOverview A figure data enrichment AI agent.
 *
 * - enrichFigureInfo: A function that enriches figure data.
 * - EnrichFigureInfoInput - The input type for the enrichFigureInfo function.
 * - EnrichFigureInfoOutput - The return type for the enrichFigureInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

export const EnrichFigureInfoInputSchema = z.object({
  name: z.string().describe('The name of the public figure.'),
  description: z.string().optional().describe('An optional existing description to provide more context.'),
});
export type EnrichFigureInfoInput = z.infer<typeof EnrichFigureInfoInputSchema>;

export const EnrichFigureInfoOutputSchema = z.object({
  description: z.string().describe("A detailed, neutral, and encyclopedic description of the public figure, written in Spanish. Should be 2-3 paragraphs long."),
  categories: z.array(z.string()).describe("A list of 3 to 5 relevant categories for the figure in Spanish (e.g., 'Futbolista', 'Político', 'Cantante', 'Actor', 'Científico')."),
  occupation: z.string().describe("The primary occupation of the figure in Spanish."),
  nationality: z.string().describe("The nationality of the figure in Spanish."),
  gender: z.string().describe("The gender of the figure in Spanish (e.g., 'Masculino', 'Femenino')."),
});
export type EnrichFigureInfoOutput = z.infer<typeof EnrichFigureInfoOutputSchema>;

export async function enrichFigureInfo(input: EnrichFigureInfoInput): Promise<EnrichFigureInfoOutput> {
  return enrichFigureInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enrichFigureInfoPrompt',
  input: {schema: EnrichFigureInfoInputSchema},
  output: {schema: EnrichFigureInfoOutputSchema},
  prompt: `You are an expert data enricher for a public figure encyclopedia. Your task is to provide structured information about a public figure based on their name and an optional existing description. The output must be in Spanish.

Figure Name: {{{name}}}
{{#if description}}
Existing Description:
{{{description}}}
{{/if}}

Based on the provided information, generate a comprehensive and neutral description, determine their main occupation, nationality, gender, and provide a list of 3-5 specific categories.`,
});

const enrichFigureInfoFlow = ai.defineFlow(
  {
    name: 'enrichFigureInfoFlow',
    inputSchema: EnrichFigureInfoInputSchema,
    outputSchema: EnrichFigureInfoOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to enrich figure information.');
    }
    return output;
  }
);
