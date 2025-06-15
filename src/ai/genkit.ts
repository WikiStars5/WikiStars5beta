import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for text generation
});
