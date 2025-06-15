
'use server';
/**
 * @fileOverview A Genkit flow to enrich public figure information using an LLM.
 *
 * - enrichFigureInfo - A function that calls the Genkit flow to get enriched data.
 * - EnrichFigureInfoInput - The input type for the enrichFigureInfo function.
 * - EnrichFigureInfoOutput - The return type for the enrichFigureInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnrichFigureInfoInputSchema = z.object({
  figureName: z.string().describe('The name of the public figure.'),
  currentDescription: z.string().optional().describe('Any existing description for the figure.'),
  currentNationality: z.string().optional().describe('Any existing nationality for the figure.'),
  currentOccupation: z.string().optional().describe('Any existing occupation for the figure.'),
  currentGender: z.string().optional().describe('Any existing gender for the figure.'),
});
export type EnrichFigureInfoInput = z.infer<typeof EnrichFigureInfoInputSchema>;

const EnrichFigureInfoOutputSchema = z.object({
  description: z.string().optional().describe("A concise biography or description of the public figure. If an existing description was provided and is good, you can reuse it or slightly improve it. If not, generate a new one. Provide only the text, no labels."),
  nationality: z.string().optional().describe("The nationality of the public figure. If an existing nationality was provided, use it unless it's clearly incorrect. Provide only the text, no labels."),
  occupation: z.string().optional().describe("The primary occupation(s) of the public figure. If an existing occupation was provided, use it unless it's clearly incorrect. Provide only the text, no labels."),
  gender: z.string().optional().describe("The gender of the public figure (e.g., Male, Female, Non-binary). If an existing gender was provided, use it unless it's clearly incorrect. Provide only the text, no labels."),
});
export type EnrichFigureInfoOutput = z.infer<typeof EnrichFigureInfoOutputSchema>;

export async function enrichFigureInfo(input: EnrichFigureInfoInput): Promise<EnrichFigureInfoOutput> {
  return enrichFigureInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enrichFigureInfoPrompt',
  input: {schema: EnrichFigureInfoInputSchema},
  output: {schema: EnrichFigureInfoOutputSchema},
  prompt: `You are an expert biographer and data enricher.
Given the name of a public figure: "{{figureName}}", and any existing information:
- Current Description: {{#if currentDescription}}"{{currentDescription}}"{{else}}None{{/if}}
- Current Nationality: {{#if currentNationality}}"{{currentNationality}}"{{else}}None{{/if}}
- Current Occupation: {{#if currentOccupation}}"{{currentOccupation}}"{{else}}None{{/if}}
- Current Gender: {{#if currentGender}}"{{currentGender}}"{{else}}None{{/if}}

Please provide the following information. If any current information is provided and accurate, you can reuse or refine it. If it's missing or inaccurate, generate it.
Be concise and factual. For 'description', provide a brief bio (1-2 sentences).
Return ONLY the requested information in the specified output format. Do not add any extra labels, commentary, or markdown.

Example for figureName "Marie Curie":
Output should be like:
{
  "description": "Marie Curie was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.",
  "nationality": "Polish, French",
  "occupation": "Physicist, Chemist",
  "gender": "Female"
}

Respond with values for description, nationality, occupation, and gender for "{{figureName}}".`,
});

const enrichFigureInfoFlow = ai.defineFlow(
  {
    name: 'enrichFigureInfoFlow',
    inputSchema: EnrichFigureInfoInputSchema,
    outputSchema: EnrichFigureInfoOutputSchema,
  },
  async (input) => {
    // Basic safety check for input
    if (!input.figureName || input.figureName.trim() === "") {
        throw new Error("Figure name cannot be empty.");
    }

    const {output} = await prompt(input);

    // Ensure output is not null, if it is, return empty values to prevent crashes
    if (!output) {
      return {
        description: input.currentDescription || undefined,
        nationality: input.currentNationality || undefined,
        occupation: input.currentOccupation || undefined,
        gender: input.currentGender || undefined,
      };
    }
    
    return output;
  }
);
