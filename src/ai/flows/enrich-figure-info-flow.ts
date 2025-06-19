
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
  currentSpecies: z.string().optional().describe('Any existing species or race (e.g., Human, Demon, Elf).'),
  currentFirstAppearance: z.string().optional().describe('Any existing first appearance information (e.g., "High School DxD, Light Novel, 2008").'),
  currentBirthDateOrAge: z.string().optional().describe('Any existing birth date or age information (e.g., "Unknown / Appears 18").'),
  currentBirthPlace: z.string().optional().describe('Any existing place of birth.'),
  currentMaritalStatus: z.string().optional().describe('Any existing marital status (e.g., "Single", "Married").'),
  currentHeight: z.string().optional().describe('Any existing height information.'),
  currentWeight: z.string().optional().describe('Any existing weight information.'),
  currentHairColor: z.string().optional().describe('Any existing hair color.'),
});
export type EnrichFigureInfoInput = z.infer<typeof EnrichFigureInfoInputSchema>;

const EnrichFigureInfoOutputSchema = z.object({
  description: z.string().optional().describe("A concise biography or description of the public figure. If an existing description was provided and is good, you can reuse it or slightly improve it. If not, generate a new one. Provide only the text, no labels."),
  nationality: z.string().optional().describe("The nationality of the public figure. If an existing nationality was provided, use it unless it's clearly incorrect. Provide only the text, no labels."),
  occupation: z.string().optional().describe("The primary occupation(s) of the public figure. If an existing occupation was provided, use it unless it's clearly incorrect. Provide only the text, no labels."),
  gender: z.string().optional().describe("The gender of the public figure (e.g., Male, Female, Non-binary). If an existing gender was provided, use it unless it's clearly incorrect. Provide only the text, no labels."),
  species: z.string().optional().describe("The species or race of the figure (e.g., Human, Demon, Elf). Provide only the text, no labels."),
  firstAppearance: z.string().optional().describe("The first appearance of the figure (e.g., 'High School DxD, Light Novel, 2008'). Provide only the text, no labels."),
  birthDateOrAge: z.string().optional().describe("The birth date or age of the figure (e.g., 'Unknown / Appears 18'). Provide only the text, no labels."),
  birthPlace: z.string().optional().describe("The place of birth of the figure. Provide only the text, no labels."),
  maritalStatus: z.string().optional().describe("The marital status of the figure (e.g., 'Single', 'Married'). Provide only the text, no labels."),
  height: z.string().optional().describe("The height of the figure (e.g., '1.68 cm'). Provide only the text, no labels."),
  weight: z.string().optional().describe("The weight of the figure (e.g., '56 kg'). Often optional or not revealed for fictional characters. Provide only the text, no labels."),
  hairColor: z.string().optional().describe("The hair color of the figure. Provide only the text, no labels."),
});
export type EnrichFigureInfoOutput = z.infer<typeof EnrichFigureInfoOutputSchema>;

export async function enrichFigureInfo(input: EnrichFigureInfoInput): Promise<EnrichFigureInfoOutput> {
  return enrichFigureInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enrichFigureInfoPrompt',
  input: {schema: EnrichFigureInfoInputSchema},
  output: {schema: EnrichFigureInfoOutputSchema},
  prompt: `You are an expert biographer and data enricher for a character wiki.
Given the name of a public figure or fictional character: "{{figureName}}", and any existing information:
- Current Description: {{#if currentDescription}}"{{currentDescription}}"{{else}}None{{/if}}
- Current Nationality: {{#if currentNationality}}"{{currentNationality}}"{{else}}None{{/if}}
- Current Occupation: {{#if currentOccupation}}"{{currentOccupation}}"{{else}}None{{/if}}
- Current Gender: {{#if currentGender}}"{{currentGender}}"{{else}}None{{/if}}
- Current Species: {{#if currentSpecies}}"{{currentSpecies}}"{{else}}None{{/if}}
- Current First Appearance: {{#if currentFirstAppearance}}"{{currentFirstAppearance}}"{{else}}None{{/if}}
- Current Birth Date/Age: {{#if currentBirthDateOrAge}}"{{currentBirthDateOrAge}}"{{else}}None{{/if}}
- Current Birth Place: {{#if currentBirthPlace}}"{{currentBirthPlace}}"{{else}}None{{/if}}
- Current Marital Status: {{#if currentMaritalStatus}}"{{currentMaritalStatus}}"{{else}}None{{/if}}
- Current Height: {{#if currentHeight}}"{{currentHeight}}"{{else}}None{{/if}}
- Current Weight: {{#if currentWeight}}"{{currentWeight}}"{{else}}None{{/if}}
- Current Hair Color: {{#if currentHairColor}}"{{currentHairColor}}"{{else}}None{{/if}}

Please provide the following information. If any current information is provided and accurate, you can reuse or refine it. If it's missing or inaccurate, generate it.
Be concise and factual. For 'description', provide a brief bio (1-2 sentences).
For fictional characters, try to find canonical information. If not available, you can state "Unknown" or infer reasonably based on common portrayals.
Return ONLY the requested information in the specified output format. Do not add any extra labels, commentary, or markdown.

Example for figureName "Akeno Himejima":
Output should be like:
{
  "description": "Akeno Himejima is one of the main heroines of High School DxD. She is a third-year student at Kuoh Academy and one of the 'Two Great Ladies' of Kuoh Academy alongside Rias Gremory.",
  "nationality": "Japanese (in-universe)",
  "occupation": "Student, Vice-President of the Occult Research Club",
  "gender": "Female",
  "species": "Reincarnated Devil (Human/Fallen Angel Hybrid)",
  "firstAppearance": "High School DxD Volume 1 (Light Novel, 2008)",
  "birthDateOrAge": "Unknown / Appears 18-19",
  "birthPlace": "Japan (Human Realm)",
  "maritalStatus": "Single (though part of Issei's harem)",
  "height": "168cm (5'6\")",
  "weight": "54kg (119 lbs)",
  "hairColor": "Black"
}

Respond with values for all fields in the EnrichFigureInfoOutputSchema for "{{figureName}}".`,
});

const enrichFigureInfoFlow = ai.defineFlow(
  {
    name: 'enrichFigureInfoFlow',
    inputSchema: EnrichFigureInfoInputSchema,
    outputSchema: EnrichFigureInfoOutputSchema,
  },
  async (input) => {
    if (!input.figureName || input.figureName.trim() === "") {
        throw new Error("Figure name cannot be empty.");
    }

    const {output} = await prompt(input);

    if (!output) {
      return {
        description: input.currentDescription || undefined,
        nationality: input.currentNationality || undefined,
        occupation: input.currentOccupation || undefined,
        gender: input.currentGender || undefined,
        species: input.currentSpecies || undefined,
        firstAppearance: input.currentFirstAppearance || undefined,
        birthDateOrAge: input.currentBirthDateOrAge || undefined,
        birthPlace: input.currentBirthPlace || undefined,
        maritalStatus: input.currentMaritalStatus || undefined,
        height: input.currentHeight || undefined,
        weight: input.currentWeight || undefined,
        hairColor: input.currentHairColor || undefined,
      };
    }
    
    return output;
  }
);
