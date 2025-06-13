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
  averageRating: number; // Will be calculated and updated
  totalRatings: number;  // Will be calculated and updated
  perceptionCounts: Record<PerceptionKeys, number>; // This might be updated too, or kept simple
}

export interface UserRating {
  id?: string; // Document ID from Firestore (userId_figureId)
  userId: string;
  figureId: string;
  perception: PerceptionKeys;
  stars: number; // 1-5
  timestamp: string; // ISO date string
}

export interface Comment {
  id: string; // Document ID from Firestore
  figureId: string;
  figureName?: string; // Denormalized for admin panel
  userId: string;
  userName: string; // Denormalized
  userAvatarUrl?: string; // Denormalized
  commentText: string;
  parentCommentId: string | null;
  likesCount: number;
  dislikesCount: number;
  timestamp: string; // ISO date string
  status: 'pending' | 'approved' | 'rejected';
  replies?: Comment[]; // For client-side structuring of fetched replies
  userStarRatingForFigure?: number; // Fetched and added client-side for display
}

export interface UserProfile {
  id: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

// Simulated current user - in a real app, this would come from an auth context
export const mockUser: UserProfile | null = {
  id: 'user123', // This ID will be treated as admin
  displayName: 'DemoUser (Admin)',
  email: 'admin@example.com',
  avatarUrl: 'https://placehold.co/40x40.png?text=AD',
};

// export const mockUser: UserProfile | null = {
//   id: 'user456',
//   displayName: 'RegularUser',
//   email: 'user@example.com',
//   avatarUrl: 'https://placehold.co/40x40.png?text=RU',
// };

// export const mockUser: UserProfile | null = null; // Simulate logged out state
