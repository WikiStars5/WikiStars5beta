
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for Firebase Functions
setGlobalOptions({maxInstances: 10, region: "us-central1"});

// This file is intentionally left mostly blank.
// The Genkit-based function for enrichment has been removed as requested.
// The push notification function has been moved to its own file in `src/functions/src/index.ts`.
