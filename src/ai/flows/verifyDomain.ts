
'use server';
/**
 * @fileOverview A flow to verify if a domain is real and accessible.
 *
 * - verifyDomain - A function that handles the domain verification.
 * - DomainVerificationInput - The input type for the function.
 * - DomainVerificationOutput - The return type for the function.
 */

import { z } from 'zod';
import fetch from 'node-fetch';

const DomainVerificationInputSchema = z.object({
  domain: z.string().describe('The root domain to verify (e.g., google.com).'),
});
export type DomainVerificationInput = z.infer<typeof DomainVerificationInputSchema>;

const DomainVerificationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the domain is real and accessible.'),
  error: z.string().nullable().describe('The error message if verification fails.'),
});
export type DomainVerificationOutput = z.infer<typeof DomainVerificationOutputSchema>;


export async function verifyDomain(
  input: DomainVerificationInput
): Promise<DomainVerificationOutput> {
  try {
    const url = `https://${input.domain}`;
    
    // We use a HEAD request for efficiency as we don't need the body content.
    // We also set a timeout to avoid long waits for unresponsive servers.
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });

    // We consider any 2xx or 3xx status code as a success.
    // 3xx redirects are fine, they indicate the domain exists.
    if (response.status >= 200 && response.status < 400) {
      return {
        isValid: true,
        error: null,
      };
    } else {
       return {
        isValid: false,
        error: `El dominio respondió con un código de estado ${response.status}.`,
      };
    }

  } catch (error: any) {
    console.error(`Domain verification failed for "${input.domain}":`, error);

    // Provide a more user-friendly error message for common network issues.
    if (error.code === 'ENOTFOUND' || error.type === 'system') {
        return {
            isValid: false,
            error: 'No se pudo encontrar el dominio. Asegúrate de que está escrito correctamente.',
        };
    }
    
    return {
      isValid: false,
      error: 'Ocurrió un error de red al intentar verificar el dominio.',
    };
  }
}
