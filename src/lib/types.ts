
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
  sportSubcategory?: string; // New field for sport details

  // Detailed fields (previously distinct, now integrated)
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

export interface UserPerception {
  userId: string;
  figureId: string;
  emotion: EmotionKey;
  timestamp: Timestamp; 
}

// Type for storing emotion vote in localStorage
export interface EmotionVote {
  figureId: string;
  emotion: EmotionKey;
}


export interface UserAttitude {
  userId: string;
  figureId: string;
  attitude: AttitudeKey;
  timestamp: Timestamp; 
}

// Type for storing attitude in localStorage
export interface Attitude {
  figureId: string;
  attitude: AttitudeKey;
  addedAt: string; // ISO String for the date
}


export interface UserStarRating {
  userId: string;
  figureId: string;
  starValue: StarValue; 
  timestamp: Timestamp; 
}

export interface UserComment {
  id: string; 
  figureId: string;
  userId: string;
  username: string; 
  guestUsername?: string | null;
  guestUsernameLower?: string | null;
  guestGender?: string;
  userPhotoURL: string | null; 
  text: string;
  starRatingGiven: StarValue | null; 
  createdAt: Timestamp; 
  updatedAt?: Timestamp | null;
  likes: number;
  dislikes: number;
  likedBy: string[]; 
  dislikedBy: string[];
  parentId?: string | null; // ID of the parent comment if this is a reply
  replyCount?: number; // Number of replies this comment has
  userCountryCode?: string | null;
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
  fcmToken?: string; // Field to store the Firebase Cloud Messaging token
  achievements?: string[]; // Array of unlocked achievement IDs
  isAnonymous?: boolean;
}

export interface LocalUserStreak {
  figureId: string;
  figureName: string;
  figurePhotoUrl: string;
  currentStreak: number;
  lastCommentDate: string; // Stored as 'YYYY-MM-DD'
}

export interface FanFigure {
  id: string;
  name: string;
  photoUrl: string;
  addedAt: string; // Stored as ISO string
}


export interface GenderOption {
  value: string;
  label: string;
  symbol?: string; // e.g., '♂', '♀'
}

export interface Notification {
  id: string;
  userId: string; // ID of the user to notify
  actorId: string; // ID of the user who performed the action
  actorName: string;
  actorPhotoUrl: string | null;
  type: 'reply' | 'like';
  isRead: boolean;
  figureId: string;
  figureName: string;
  commentId: string; // ID of the comment that was replied to or liked
  replyId?: string; // ID of the reply itself, if applicable
  createdAt: Timestamp;
}

export interface CategoryOption {
  value: string;
  label: string;
}
