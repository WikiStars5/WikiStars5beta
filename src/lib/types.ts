
export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater"; // This might become unused if Disqus handles perception entirely.

export interface PerceptionOption { // This might become unused.
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

export type EmotionKey = 'alegria' | 'envidia' | 'tristeza' | 'miedo' | 'desagrado' | 'furia';

export interface Figure {
  id: string;
  name: string;
  nameLower: string; // For case-insensitive search
  photoUrl: string;
  description?: string;
  nationality?: string;
  occupation?: string;
  gender?: string;
  perceptionCounts?: Record<EmotionKey, number>; // Nuevo campo para conteo de emociones
}

export interface UserPerception {
  userId: string;
  figureId: string;
  emotion: EmotionKey;
  timestamp: any; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}
