
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {genkit, configureGenkit} from "genkit";
import {googleAI} from "@genkit/google-ai";
import {z} from "zod";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Genkit
configureGenkit({
  plugins: [
    googleAI(),
  ],
  logSinks: [],
  traceStore: "none",
});

// Set global options for Firebase Functions
setGlobalOptions({maxInstances: 10, region: "us-central1"});


// Define the input and output schemas for our AI flow using Zod
const EnrichFigureInfoInputSchema = z.object({
  name: z.string().describe("The full name of the public figure."),
  existingDescription: z.string().optional().describe("An optional existing description to provide context."),
});

const EnrichFigureInfoOutputSchema = z.object({
  categories: z.array(z.string()).describe("An array of 3 to 5 relevant categories for the figure (e.g., 'Actor', 'Scientist', 'Historical Figure', 'Musician')."),
});

// Define the Genkit prompt
const enrichPrompt = genkit.definePrompt({
  name: "enrichFigurePrompt",
  input: {schema: EnrichFigureInfoInputSchema},
  output: {schema: EnrichFigureInfoOutputSchema},
  prompt: `
      You are a biographical data enrichment specialist for a wiki.
      Your task is to provide a list of relevant categories for a public figure based on their name.
      Provide the information in Spanish.

      Figure Name: {{{name}}}
      {{#if existingDescription}}
      Context (Existing Description): {{{existingDescription}}}
      {{/if}}

      Generate only the following information:
      1.  **categories**: A list of 3-5 relevant categories for the person.
    `,
  config: {
    temperature: 0.3, // Lower temperature for more factual, less creative output
  },
});

// Define the main Genkit flow
const enrichFigureFlow = genkit.defineFlow(
  {
    name: "enrichFigureFlow",
    inputSchema: EnrichFigureInfoInputSchema,
    outputSchema: EnrichFigureInfoOutputSchema,
  },
  async (input) => {
    const {output} = await enrichPrompt(input);
    return output!;
  }
);


// Create the callable Firebase Function that will run the Genkit flow.
export const enrichFigureInfo = onCall(
  {
    secrets: ["GOOGLE_GENAI_API_KEY"],
    cors: true,
  },
  async (request) => {
    // Check for authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    
    // Validate the incoming data against our Zod schema
    const validatedInput = EnrichFigureInfoInputSchema.safeParse(request.data);
    if (!validatedInput.success) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a valid 'name'."
      );
    }
    
    // Run the Genkit flow with the validated data
    try {
      const result = await enrichFigureFlow(validatedInput.data);
      return result;
    } catch (error) {
      console.error("Error running Genkit flow:", error);
      throw new HttpsError(
        "internal",
        "An unexpected error occurred while enriching figure info."
      );
    }
  }
);
