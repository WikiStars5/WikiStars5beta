import type { ReactNode } from 'react';
import type { Timestamp } from 'firebase/firestore';

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';
export type AttitudeKey = 'neutral' | 'fan' | 'simp' | 'hater';

export interface Figure {
  id: string;
  name: string;
  nameLower: string;
  photoUrl: string;
  description?: string;
  
  nationality?: string;
  nationalityCode?: string; // Added to store country code
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

  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
  };

  relatedFigureIds?: string[];

  perceptionCounts: Record<EmotionKey, number>;
  attitudeCounts: Record<AttitudeKey, number>;
  
  createdAt?: string; 
  status?: 'approved' | 'rejected' | 'pending'; 
  isFeatured?: boolean;
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

export interface Comment {
  id: string;
  figureId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string | null;
  authorGender?: string;
  authorCountry?: string;
  authorCountryCode?: string;
  text: string;
  createdAt: Timestamp;
  likes: string[]; // Array of user IDs who liked the comment
  likeCount: number;
  dislikes: string[]; // Array of user IDs who disliked the comment
  dislikeCount: number;
  replies: Comment[]; // For nested replies
  replyCount: number;
  isAnonymous: boolean;
}

export interface LocalUserStreak {
    figureId: string;
    figureName: string;
    figurePhotoUrl?: string;
    currentStreak: number;
    lastCommentDate: string;
}

// The 'Notification' type has been simplified as the comment system, which was the primary source
// of notifications, has been removed.
export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  actorPhotoUrl?: string;
  figureId: string;
  figureName: string;
  commentId: string; // The original comment that was replied to or liked
  replyId?: string; // The ID of the new reply
  type: 'like' | 'reply' | 'system'; // Simplified types
  isRead: boolean;
  createdAt: Timestamp;
}
