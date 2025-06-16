
import type { ReactNode } from 'react';

export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater";

export interface PerceptionOption {
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';
export type AttitudeKey = 'neutral' | 'fan' | 'simp' | 'hater';

export interface Figure {
  id: string;
  name: string;
  nameLower: string;
  photoUrl: string;
  description?: string;
  nationality?: string;
  occupation?: string;
  gender?: string;
  perceptionCounts?: Record<EmotionKey, number>;
  attitudeCounts?: Record<AttitudeKey, number>;
  createdAt?: string;
  // New fields for average rating
  averageRating?: number;
  totalRatings?: number;
}

export interface UserPerception {
  userId: string;
  figureId: string;
  emotion: EmotionKey;
  timestamp: any;
}

export interface UserAttitude {
  userId: string;
  figureId: string;
  attitude: AttitudeKey;
  timestamp: any;
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
  createdAt: string;
  lastLoginAt?: string;
}

// New type for individual user ratings on a figure
export interface FigureUserRating {
  userId: string;
  figureId: string;
  rating: number; // 1-5
  timestamp: any; // Firestore ServerTimestamp
}

// New type for comments on a figure
export interface FigureComment {
  id: string; // Auto-generated Firestore ID
  figureId: string;
  userId: string;
  username: string; // Denormalized for display
  userPhotoURL?: string | null; // Denormalized for display
  commentText: string;
  ratingGiven: number; // Rating given at the time of comment (1-5)
  timestamp: any; // Firestore ServerTimestamp, will be string after fetch
  createdAt?: string; // Serialized timestamp
}
