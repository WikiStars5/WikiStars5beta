

export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater"; // This might become unused if Disqus handles perception entirely.

export interface PerceptionOption { // This might become unused.
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';
export type AttitudeKey = 'neutral' | 'fan' | 'simp' | 'hater';

export interface Figure {
  id: string;
  name: string;
  nameLower: string; // For case-insensitive search
  photoUrl: string;
  description?: string;
  nationality?: string;
  occupation?: string;
  gender?: string;
  perceptionCounts?: Record<EmotionKey, number>;
  attitudeCounts?: Record<AttitudeKey, number>; // New field for attitude counts
  createdAt?: string; 
}

export interface UserPerception {
  userId: string;
  figureId: string;
  emotion: EmotionKey;
  timestamp: any; 
}

export interface UserAttitude { // New type for user attitude votes
  userId: string;
  figureId: string;
  attitude: AttitudeKey;
  timestamp: any; 
}

export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  emoji: string;
}

export interface UserProfile {
  uid: string; // Firebase Auth UID, primary key
  email: string | null; // From Firebase Auth
  username: string; // Public display name, can be different from Firebase Auth displayName
  country?: string; // Full name of the country selected by the user
  countryCode?: string; // ISO 3166-1 alpha-2 code of the selected country
  photoURL?: string | null; // From Firebase Auth, can be updated if profile picture feature is added
  role: 'user' | 'admin'; // User role
  createdAt: string; 
  lastLoginAt?: string; 
}


