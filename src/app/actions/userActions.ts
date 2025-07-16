// This file is intentionally left blank. 
// The user management logic that required 'firebase-admin' has been moved 
// to a secure onCall Firebase Function in `functions/src/index.ts` (the `getAllUsers` function).
// This was necessary to resolve persistent build errors. Client components
// should now call the Firebase Function directly to get user data.
