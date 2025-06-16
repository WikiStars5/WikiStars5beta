
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
  status?: 'approved' | 'pending_verification' | 'rejected';
  // Campos para el sistema de calificación estilo Play Store
  averageRating?: number;
  totalRatings?: number;
  ratingDistribution?: {
    '1': number; // count for 1 star
    '2': number; // count for 2 stars
    '3': number; // count for 3 stars
    '4': number; // count for 4 stars
    '5': number; // count for 5 stars
  };
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
  timestamp:any;
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

