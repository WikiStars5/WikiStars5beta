// === src/ai/genkit.ts ===
// Configuración principal de Genkit y sus plugins de IA.
// Aquí se configura la clave API para Google AI (Gemini).

import dotenv from 'dotenv';
dotenv.config(); // Carga las variables de entorno desde el archivo .env (si existe)

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    // Aquí es donde pasamos la clave API directamente al plugin googleAI().
    // Es CRÍTICO que esta sea tu CLAVE DE API DE GEMINI VÁLIDA.
    // Para producción, se recomienda usar process.env.GOOGLE_API_KEY o similar.
    googleAI({ apiKey: "AIzaSyAnK1fb2-3hmnGvOJgSc4vfoKyfVWq6Hi4" }), // <-- ¡TU CLAVE API AQUÍ!
  ],
  model: 'googleai/gemini-2.0-flash', // Modelo por defecto para la generación de texto
  // Puedes añadir otras configuraciones de Genkit aquí si las necesitas
});