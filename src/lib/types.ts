
import type { ReactNode } from 'react';
import type { Timestamp } from 'firebase/firestore';

export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater";

export interface PerceptionOption {
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

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
  
  // Basic Info previously present
  nationality?: string;
  occupation?: string;
  gender?: string;

  // New detailed fields
  alias?: string;
  species?: string; // e.g., Human, Demon, Elf
  firstAppearance?: string; // e.g., "High School DxD, Light Novel, 2008"
  birthDateOrAge?: string; // e.g., "Unknown / Appears 18"
  birthPlace?: string;
  statusLiveOrDead?: string; // e.g., "Alive", "Deceased", "Unknown"
  maritalStatus?: string; // e.g., "Single", "Married"
  
  // Physical Appearance
  height?: string;
  weight?: string; // Often optional for fictional
  hairColor?: string;
  eyeColor?: string;
  distinctiveFeatures?: string; // e.g., "Tall ponytail", "Scar over left eye"

  perceptionCounts?: Record<EmotionKey, number>;
  attitudeCounts?: Record<AttitudeKey, number>;
  starRatingCounts?: Record<StarValueAsString, number>;
  commentCount?: number; // Contador de comentarios
  createdAt?: string; // ISO string
  status?: 'approved' | 'rejected'; // For proposals, not directly used now
}

export interface UserPerception {
  userId: string;
  figureId: string;
  emotion: EmotionKey;
  timestamp: Timestamp; // Firestore Timestamp
}

export interface UserAttitude {
  userId: string;
  figureId: string;
  attitude: AttitudeKey;
  timestamp: Timestamp; // Firestore Timestamp
}

export interface UserStarRating {
  userId: string;
  figureId: string;
  starValue: StarValue; // 1, 2, 3, 4, or 5
  timestamp: Timestamp; // Firestore Timestamp
}

export interface UserComment {
  id: string; // Document ID
  figureId: string;
  userId: string;
  username: string; // Denormalized for display
  userPhotoURL: string | null; // Denormalized for display
  text: string;
  starRatingGiven: StarValue | null; // User's star rating for the FIGURE at the time of comment
  createdAt: Timestamp; // Firestore Timestamp for server-side ordering
  updatedAt?: Timestamp | null;
  likes: number;
  dislikes: number;
  likedBy: string[]; // Array of user IDs
  dislikedBy: string[]; // Array of user IDs
}


export interface Country {
  name: string;
  code: string;
  emoji: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  country?: string;
  countryCode?: string;
  photoURL?: string | null;
  role: 'user' | 'admin';
  createdAt: string; // ISO string
  lastLoginAt?: string; // ISO string
}

