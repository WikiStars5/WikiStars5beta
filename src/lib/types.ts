
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
  averageRating: number; // Promedio de estrellas de comentarios de nivel superior que incluyeron estrellas
  totalRatings: number;   // Conteo de comentarios de nivel superior que INCLUYERON una calificación por estrellas
  perceptionCounts: Record<PerceptionKeys, number>; // Conteo de cada tipo de percepción enviada independientemente
}

// UserRating ahora SOLO para percepción. Las estrellas no se almacenan aquí.
export interface UserRating {
  id?: string; // Document ID: userId_figureId
  userId: string;
  figureId: string;
  perception: PerceptionKeys; // Solo la percepción
  timestamp: string; // Marca de tiempo de la última selección de percepción
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
  status: 'pending' | 'approved' | 'rejected'; // Ahora siempre será 'approved' al crear
  replies?: Comment[];
  starRatingGivenByAuthor?: number; // Calificación opcional (1-5) dada CON este comentario
}

export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}
