export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater";

export interface PerceptionOption {
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

export interface Figure {
  id: string;
  name: string;
  photoUrl: string; // Will store Firebase Storage URL or placeholder
  description?: string; // Short bio or category
  averageRating: number;
  totalRatings: number;
  perceptionCounts: Record<PerceptionKeys, number>;
}

export interface UserRating {
  userId: string;
  figureId: string;
  perception: PerceptionKeys;
  stars: number; // 1-5
  timestamp: string; // ISO date string
}

export interface Comment {
  id: string;
  figureId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl: string;
  userStarRating?: number; // User's star rating for the figure at time of comment
  text: string;
  parentId: string | null; // For replies
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  timestamp: string; // ISO date string
  replies?: Comment[]; // Nested replies
  isModerated?: boolean; // If comment was hidden by admin
}

export interface UserProfile {
  id: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  // roles?: ('admin' | 'user')[]; // For future role-based access
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
