import type { Figure, Comment, UserRating, PerceptionOption } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

export const PERCEPTION_OPTIONS: PerceptionOption[] = [
  { key: 'neutral', label: 'Neutral', icon: Meh },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];

// USER_RATINGS_DATA and COMMENTS_DATA remain as placeholders for now
// They are not part of this Firestore migration for "figures"
export const USER_RATINGS_DATA: UserRating[] = [
  { userId: 'user123', figureId: 'elon-musk', perception: 'fan', stars: 5, timestamp: new Date().toISOString() },
  { userId: 'user456', figureId: 'elon-musk', perception: 'hater', stars: 1, timestamp: new Date().toISOString() },
  { userId: 'user123', figureId: 'taylor-swift', perception: 'simp', stars: 5, timestamp: new Date().toISOString() },
];

export let COMMENTS_DATA: Comment[] = [
  {
    id: 'comment1',
    figureId: 'elon-musk', // This would be a Firestore ID in a full system
    userId: 'user123',
    userDisplayName: 'TechBro',
    userAvatarUrl: 'https://placehold.co/40x40.png?text=TB',
    userStarRating: 5,
    text: 'Elon is a visionary! To the moon!',
    parentId: null,
    likes: 15,
    dislikes: 2,
    likedBy: [],
    dislikedBy: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), 
  },
  // ... other comments
];


// --- Firestore Figure Operations ---

export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    await setDoc(figureRef, figure);
    console.log("Figure added to Firestore:", figure);
  } catch (error) {
    console.error("Error adding figure to Firestore: ", error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const updateFigureInFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    await updateDoc(figureRef, { ...figure }); // Use updateDoc or setDoc with merge:true
    console.log("Figure updated in Firestore:", figure);
  } catch (error) {
    console.error("Error updating figure in Firestore: ", error);
    throw error;
  }
};

export const deleteFigureFromFirestore = async (figureId: string): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figureId);
    await deleteDoc(figureRef);
    console.log("Figure deleted from Firestore:", figureId);
  } catch (error) {
    console.error("Error deleting figure from Firestore: ", error);
    throw error;
  }
};

export const getFigureFromFirestore = async (id: string): Promise<Figure | undefined> => {
  try {
    const figureRef = doc(db, "figures", id);
    const figureSnap = await getDoc(figureRef);
    if (figureSnap.exists()) {
      return { id: figureSnap.id, ...figureSnap.data() } as Figure;
    } else {
      console.log("No such figure in Firestore!");
      return undefined;
    }
  } catch (error) {
    console.error("Error fetching figure from Firestore: ", error);
    throw error;
  }
};

export const getAllFiguresFromFirestore = async (): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, orderBy("name")); // Optional: order by name
    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((doc) => {
      figures.push({ id: doc.id, ...doc.data() } as Figure);
    });
    return figures;
  } catch (error) {
    console.error("Error fetching all figures from Firestore: ", error);
    throw error; // Or return empty array: return [];
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 3): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    // Example: order by totalRatings descending and take the top 'count'
    // You might want a more sophisticated way to determine "featured"
    const q = query(figuresCollectionRef, orderBy("totalRatings", "desc"), limit(count));
    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((doc) => {
      figures.push({ id: doc.id, ...doc.data() } as Figure);
    });
    // If fewer than 'count' figures match the query, fill with any other figures up to 'count'
    if (figures.length < count) {
      const allFigures = await getAllFiguresFromFirestore();
      const additionalFigures = allFigures.filter(af => !figures.find(f => f.id === af.id));
      figures.push(...additionalFigures.slice(0, count - figures.length));
    }
    return figures;
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    return []; // Return empty on error or re-throw
  }
}


// --- Functions for Comments and UserRatings (still using placeholder data) ---
export const getCommentsForFigure = (figureId: string): Comment[] => {
  const allComments = COMMENTS_DATA.filter(comment => comment.figureId === figureId);
  const topLevelComments = allComments.filter(comment => !comment.parentId);
  
  return topLevelComments.map(comment => ({
    ...comment,
    replies: allComments.filter(reply => reply.parentId === comment.id)
                        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getUserRatingForFigure = (userId: string, figureId: string): UserRating | undefined => {
  // This would also fetch from Firestore in a full implementation
  return USER_RATINGS_DATA.find(rating => rating.userId === userId && rating.figureId === figureId);
};
