
export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater";

export interface PerceptionOption {
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

export interface Figure {
  id: string;
  name: string;
  photoUrl: string;
  description?: string;
  averageRating: number; // Average of stars submitted WITH new top-level comments
  totalRatings: number;   // Count of new top-level comments that INCLUDED a star rating
  perceptionCounts: Record<PerceptionKeys, number>; // From independent perception submissions
}

// UserRating now ONLY for perception. Stars are not stored here.
export interface UserRating {
  id?: string; // Document ID: userId_figureId
  userId: string;
  figureId: string;
  perception: PerceptionKeys;
  timestamp: string;
}

export interface Comment {
  id: string;
  figureId: string;
  figureName?: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  commentText: string;
  parentCommentId: string | null;
  likesCount: number;
  dislikesCount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected'; // Will be 'approved' by default now
  replies?: Comment[];
  starRatingGivenByAuthor?: number; // Optional star rating submitted with this comment (1-5)
}

export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}
