
"use client";

// This file is no longer used as the Google Sign-In functionality has been removed
// per the user's request to match their enabled authentication providers.
// It is kept in the project to avoid breaking potential import statements, but its content is cleared.

export function useAuthWithGoogle() {
  return { 
    signInWithGoogle: () => Promise.resolve(), 
    isGoogleLoading: false 
  };
}
