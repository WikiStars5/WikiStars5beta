
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
  averageRating: number;
  totalRatings: number;
  perceptionCounts: Record<PerceptionKeys, number>;
}

export interface UserRating {
  id?: string;
  userId: string;
  figureId: string;
  perception: PerceptionKeys;
  stars: number;
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
  status: 'pending' | 'approved' | 'rejected';
  replies?: Comment[];
  userStarRatingForFigure?: number;
}

// UserProfile now reflects common properties from firebase.User
export interface UserProfile {
  uid: string; // Changed from id to uid to match Firebase
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null; // Changed from avatarUrl to photoURL
}

// mockUser is now commented out as we are implementing real Firebase authentication.
// You can uncomment for specific testing if needed, but the app will rely on Firebase Auth.
/*
export const mockUser: UserProfile | null = {
  uid: 'YOUR_ACTUAL_ADMIN_UID', // This ID will be treated as admin if uncommented
  displayName: 'DemoUser (Admin)',
  email: 'admin@example.com',
  photoURL: 'https://placehold.co/40x40.png?text=AD',
};
*/

/*
export const mockUser: UserProfile | null = {
  uid: 'user456',
  displayName: 'RegularUser',
  email: 'user@example.com',
  photoURL: 'https://placehold.co/40x40.png?text=RU',
};
*/

// export const mockUser: UserProfile | null = null; // Simulate logged out state
