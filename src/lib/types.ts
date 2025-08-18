

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

  perceptionCounts: Record<EmotionKey, number>;
  attitudeCounts: Record<AttitudeKey, number>;
  
  createdAt?: string; 
  status?: 'approved' | 'rejected' | 'pending'; 
  isFeatured?: boolean;
}


export interface Review {
    id: string;
    characterId: string;
    userId: string;
    username: string;
    userPhotoUrl?: string | null;
    comment: string;
    createdAt: Timestamp;
    likes: string[];
    replyCount: number;
}

export interface UserPerception {
  userId: string;
  figureId: string;
  emotion: EmotionKey;
  timestamp: Timestamp; 
}

export interface UserAttitude {
  userId: string;
  figureId: string;
  attitude: AttitudeKey;
  timestamp: Timestamp; 
}

export interface Attitude {
  figureId: string;
  attitude: AttitudeKey;
  addedAt: string; 
}

export interface EmotionVote {
  figureId: string;
  emotion: EmotionKey;
  addedAt: string; 
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
  gender?: string; 
  photoURL?: string | null;
  role: 'user' | 'admin';
  createdAt: string; 
  lastLoginAt?: string;
  fcmToken?: string;
  achievements?: string[];
  isAnonymous?: boolean;
}

export interface GenderOption {
  value: string;
  label: string;
  symbol?: string; 
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface LocalUserStreak {
    figureId: string;
    figureName: string;
    figurePhotoUrl?: string;
    currentStreak: number;
    lastCommentDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  actorPhotoUrl?: string;
  type: 'reply' | 'like';
  figureId: string;
  figureName: string;
  commentId: string;
  replyId?: string; // Only for 'reply' type
  isRead: boolean;
  createdAt: Timestamp;
}
