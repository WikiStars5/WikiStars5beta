
export type PerceptionKeys = "neutral" | "fan" | "simp" | "hater"; // This might become unused if Disqus handles perception entirely.

export interface PerceptionOption { // This might become unused.
  key: PerceptionKeys;
  label: string;
  icon: React.ElementType;
}

export interface Figure {
  id: string;
  name: string;
  nameLower: string; // For case-insensitive search
  photoUrl: string;
  description?: string;
  // averageRating, totalRatings, and perceptionCounts are removed
  // as the app will no longer manage these. Disqus is expected to handle them
  // or they are no longer displayed if not provided by Disqus.
}

// UserRating type is removed as the app no longer manages this in Firebase.

// Comment type is removed as the app no longer manages this in Firebase for creation/display.
// DisqusComments component handles Disqus integration.

export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}
