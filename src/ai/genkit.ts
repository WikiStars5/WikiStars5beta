
'use server';
import {genkit, Plugin, durable, resume} from 'genkit';
import {googleAI} from 'genkit/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1', 'v1beta'],
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
