
'use server';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app as firebaseApp } from '@/lib/firebase';

// Define the types for the input and output of the callable function
// This ensures type safety between the client and the function.
interface EnrichFigureInfoInput {
  name: string;
  existingDescription?: string;
}

interface EnrichFigureInfoOutput {
  description: string;
  categories: string[];
  occupation: string;
  gender: string;
  nationality: string;
}

// This server action is now a wrapper that calls the Firebase Function.
export async function enrichAndSaveFigureData(input: EnrichFigureInfoInput): Promise<{ success: boolean; data?: EnrichFigureInfoOutput; error?: string }> {
  try {
    const functions = getFunctions(firebaseApp, 'us-central1');
    const enrichFigureInfo = httpsCallable<EnrichFigureInfoInput, EnrichFigureInfoOutput>(functions, 'enrichfigureinfo');
    
    const result = await enrichFigureInfo(input);
    
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("Error calling 'enrichFigureInfo' Firebase Function:", error);
    let errorMessage = "An error occurred while communicating with the AI service.";
    if (error.code === 'unauthenticated') {
      errorMessage = "Authentication error. Please make sure you are logged in.";
    } else if (error.code === 'invalid-argument') {
      errorMessage = "Invalid data sent to the AI service.";
    } else if (error.details) {
      errorMessage = error.details.message || errorMessage;
    }
    return { success: false, error: errorMessage };
  }
}
