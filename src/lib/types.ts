

import type { ReactNode } from 'react';
import type { Timestamp } from 'firebase/firestore';

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';
export type AttitudeKey = 'neutral' | 'fan' | 'simp' | 'hater';
export type RatingValue = 0 | 1 | 2 | 3 | 4 | 5;
export type ProfileType = 'character' | 'media';
export type CreationMethod = 'wikipedia' | 'famous_birthdays' | 'manual';


// Define specific media sub-categories
export type MediaSubcategory = 
  | 'video_game' 
  | 'movie' 
  | 'series' 
  | 'book' // For novelas, libros
  | 'anime' 
  | 'manga_comic' // For manga, comic, historieta
  | 'company' 
  | 'website' 
  | 'social_media_platform'
  | 'board_game' // Juegos de mesa
  | 'animal'; // Animales

export interface Hashtag {
  id: string; // The hashtag itself, e.g., "kpop"
  // You could add more fields here if needed, like a count of how many figures use it.
}

export interface YoutubeShort {
  id: string; // Document ID from Firestore
  title: string;
  videoId: string;
  submittedBy: string; // User ID of the submitter
  submittedAt: Timestamp;
  reportedBy?: string[]; // Array of user IDs who reported it
  perceptionCounts?: Record<EmotionKey, number>;
}
  
export interface TiktokVideo {
  id: string; // Document ID from Firestore
  embedCode: string; // The full embed code from TikTok
  submittedBy: string;
  submittedAt: Timestamp;
  reportedBy?: string[];
}

export interface InstagramPost {
  id: string; // Document ID from Firestore
  embedCode: string; // The full embed code from Instagram
  postDate: string; // ISO string format of the post date
  submittedBy: string;
  submittedAt: Timestamp;
  reportedBy?: string[];
  perceptionCounts?: Record<EmotionKey, number>; // Added for emotion voting
}

export interface Figure {
  id: string;
  name: string;
  nameSearch: string;
  nameKeywords: string[]; // New field for full text search capabilities
  profileType: ProfileType; 
  photoUrl: string;
  description?: string;
  
  // --- Shared fields ---
  hashtags?: string[];
  hashtagsLower?: string[]; 
  hashtagKeywords?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
    discord?: string;
    tiktok?: string;
    website?: string;
    playStoreUrl?: string;
    appStoreUrl?: string;
    steamUrl?: string;
  };
  relatedFigureIds?: string[];
  nationality?: string; // Moved to shared
  nationalityCode?: string; // Moved to shared
  
  // --- Character-specific fields ---
  category?: string;
  occupation?: string;
  gender?: string;
  alias?: string;
  species?: string; 
  birthDateOrAge?: string; 
  deathDate?: string; // New field for date of death
  age?: number; 
  birthPlace?: string;
  statusLiveOrDead?: string; 
  maritalStatus?: string; 
  height?: string;
  heightCm?: number; 
  weight?: string; 
  hairColor?: string;
  eyeColor?: string; 
  distinctiveFeatures?: string; 

  // --- Media-specific fields ---
  mediaSubcategory?: MediaSubcategory;
  mediaGenre?: string; 
  releaseDate?: string;
  // Movie / Series / Anime
  director?: string;
  studio?: string; 
  duration?: string; // e.g. "1h 50m"
  seasons?: number;
  episodes?: number;
  // Video Game
  developer?: string; 
  publisher?: string;
  platforms?: string[];
  // Book / Manga / Comic
  author?: string; // For books, novels
  artist?: string; // For manga, comics
  volumes?: number;
  pages?: number;
  // Company / Website / Social Media
  founder?: string;
  industry?: string;
  headquarters?: string;
  websiteUrl?: string;

  // --- Core app data ---
  perceptionCounts: Record<EmotionKey, number>;
  attitudeCounts: Record<AttitudeKey, number>;
  ratingCounts?: Record<string, number>;
  
  createdAt?: string; 
  status?: 'approved' | 'rejected' | 'pending' | 'pending_admin_review'; 
  isFeatured?: boolean;

  // --- Manual Creation Fields ---
  creationMethod?: CreationMethod;
  isCommunityVerified?: boolean;
  manualVerificationExpiresAt?: Timestamp | { _seconds: number, _nanoseconds: number };
}

export interface Attitude {
  figureId: string;
  attitude: AttitudeKey;
  addedAt: string; 
}

export interface GenericEmotionVote {
    itemId: string;
    emotion: EmotionKey;
    figureId: string; // Ensure figureId is always present
}

export interface EmotionVote {
  figureId: string;
  emotion: EmotionKey;
  addedAt: string; 
}

export interface RatingVote {
    figureId: string;
    rating: RatingValue;
    addedAt: string;
}

export interface Country {
  name: string;
  code: string;
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

export interface LocalProfile {
  username: string;
  countryCode: string;
  gender: string;
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
  rating?: RatingValue;
  createdAt: Timestamp;
  lastEditedAt?: Timestamp;
  likes: string[]; // Array of user IDs who liked the comment
  likeCount: number;
  dislikes: string[]; // Array of user IDs who disliked the comment
  dislikeCount: number;
  replies: Comment[]; // For nested replies
  replyCount: number;
  isAnonymous: boolean;
}

export interface Notification {
  id: string; // Unique ID for the notification
  type: 'reply' | 'like' | 'dislike';
  figureId: string;
  figureName: string;
  commentId: string; // The ID of the comment that was replied to/liked
  replierName?: string; // Who made the reply
  reactorName?: string; // Who liked/disliked
  text: string; // Snippet of the reply or a generic message
  isRead: boolean;
  createdAt: string; // ISO string date
  replyId?: string; // The specific ID of the reply itself
}

export interface LocalUserStreak {
    figureId: string;
    currentStreak: number;
    lastCommentDate: string;
}

export interface Streak {
    userId: string;
    currentStreak: number;
    lastCommentDate: Timestamp;
    isAnonymous: boolean;
    attitude: AttitudeKey | null;
    emotion: EmotionKey | null;
    // Fields for anonymous users, stored directly in the streak document
    username?: string;
    gender?: string;
    countryCode?: string;
}

export interface StreakWithProfile extends Streak {
    figureId?: string;
    userProfile: UserProfile | null;
}
