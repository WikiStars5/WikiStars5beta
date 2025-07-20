
// This file contains type definitions used exclusively by the Cloud Functions.
// It is a copy of the relevant types from the main application's /lib/types.ts
// to ensure the functions directory is completely isolated and has no external dependencies.

import type { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';
export type AttitudeKey = 'neutral' | 'fan' | 'simp' | 'hater';
export type StarValue = 1 | 2 | 3 | 4 | 5;
export type StarValueAsString = "1" | "2" | "3" | "4" | "5";

export interface Figure {
  id: string;
  name: string;
  nameLower: string;
  photoUrl: string;
  description?: string;
  
  nationality?: string;
  occupation?: string;
  gender?: string;
  category?: string;
  sportSubcategory?: string; 

  alias?: string;
  species?: string; 
  firstAppearance?: string; 
  birthDateOrAge?: string; 
  birthPlace?: string;
  statusLiveOrDead?: string; 
  maritalStatus?: string; 
  height?: string;
  weight?: string; 
  hairColor?: string;
  eyeColor?: string; 
  distinctiveFeatures?: string; 

  perceptionCounts?: Record<EmotionKey, number>;
  attitudeCounts?: Record<AttitudeKey, number>;
  starRatingCounts?: Record<StarValueAsString, number>;
  commentCount?: number; 
  createdAt?: string; 
  status?: 'approved' | 'rejected' | 'pending'; 
  isFeatured?: boolean;
}

// Represents the data sent to the client (no sensitive info)
export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  country?: string;
  countryCode?: string;
  gender?: string; 
  photoURL?: string | null;
  role: 'user' | 'admin';
  createdAt: string; 
  lastLoginAt?: string;
  fcmToken?: string;
  achievements?: string[];
}

// Represents the full user document stored in Firestore, including sensitive fields
export interface UserDocument {
    uid: string;
    email: string;
    username: string;
    hashedPassword: string;
    salt: string;
    role: 'user' | 'admin';
    createdAt: FieldValue;
    lastLoginAt: FieldValue | null;
    photoURL?: string;
    country?: string;
    countryCode?: string;
    gender?: string;
    fcmToken?: string;
    achievements?: string[];
}
