// === src/ai/genkit.ts ===
// Configuración principal de Genkit y sus plugins de IA.
// Aquí se configura la clave API para Google AI (Gemini).

import dotenv from 'dotenv';
dotenv.config(); // Carga las variables de entorno desde el archivo .env

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Lee la clave API desde las variables de entorno (archivo .env).
// Este es un método más seguro que escribir la clave directamente en el código.
const googleApiKey = process.env.GOOGLE_API_KEY;

if (!googleApiKey || googleApiKey.includes("REPLACE_THIS")) {
    console.warn(
        'ADVERTENCIA: La variable de entorno GOOGLE_API_KEY no está configurada.' +
        ' Las funciones de IA (como autocompletar información) no funcionarán.' +
        ' Por favor, obtén una clave de Google AI Studio y añádela a tu archivo .env.'
    );
}


export const ai = genkit({
  plugins: [
    // El plugin se inicializa incluso sin una clave válida,
    // pero las llamadas a la IA fallarán hasta que se configure una.
    googleAI({ apiKey: googleApiKey || '' }),
  ],
  model: 'googleai/gemini-2.0-flash', // Modelo por defecto para la generación de texto
});