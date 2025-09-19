

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';
export type AttitudeKey = 'neutral' | 'fan' | 'simp' | 'hater';

export interface Figure {
  id: string;
  name: string;
  photoUrl: string;
  description?: string;
  
  nationality?: string;
  nationalityCode?: string; // Added to store country code
  occupation?: string;
  gender?: string;
  category?: string;
  sportSubcategory?: string; 
  hashtags?: string[];
  hashtagsLower?: string[];

  alias?: string;
  species?: string; 
  firstAppearance?: string; 
  birthDateOrAge?: string; 
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

  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
    discord?: string;
    tiktok?: string;
  };

  perceptionCounts: Record<EmotionKey, number>;
  attitudeCounts: Record<AttitudeKey, number>;

  createdAt?: string; 
  status?: 'approved' | 'rejected' | 'pending'; 
  isFeatured?: boolean;
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

export interface Country {
  name: string;
  code: string;
  emoji: string;
}
