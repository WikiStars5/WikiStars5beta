import type { Figure, PerceptionOption } from './types'; // Removed Comment, UserRating as they are now in Firestore
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

export const PERCEPTION_OPTIONS: PerceptionOption[] = [
  { key: 'neutral', label: 'Neutral', icon: Meh },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];

// USER_RATINGS_DATA and COMMENTS_DATA are now fully managed by Firestore actions.
// They are removed from here.

// --- Firestore Figure Operations ---

export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    // Ensure perceptionCounts is initialized if not provided, or handle as needed
    const figureDataWithDefaults = {
      ...figure,
      averageRating: figure.averageRating || 0,
      totalRatings: figure.totalRatings || 0,
      perceptionCounts: figure.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 },
    };
    await setDoc(figureRef, figureDataWithDefaults);
    console.log("Figure added to Firestore:", figureDataWithDefaults);
  } catch (error) {
    console.error("Error adding figure to Firestore: ", error);
    throw error;
  }
};

export const updateFigureInFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    await updateDoc(figureRef, { ...figure }); 
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
    // Note: Deleting a figure might also require deleting related ratings and comments.
    // This is not handled here for simplicity but important for production.
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
      console.log("No such figure in Firestore with ID:", id);
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
    const q = query(figuresCollectionRef, orderBy("name"));
    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push({ id: docSnap.id, ...docSnap.data() } as Figure);
    });
    return figures;
  } catch (error) {
    console.error("Error fetching all figures from Firestore: ", error);
    return []; // Return empty on error
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 3): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, orderBy("totalRatings", "desc"), limit(count));
    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push({ id: docSnap.id, ...docSnap.data() } as Figure);
    });
    
    if (figures.length < count) {
      const allFigures = await getAllFiguresFromFirestore();
      const additionalFigures = allFigures.filter(af => !figures.find(f => f.id === af.id));
      figures.push(...additionalFigures.slice(0, count - figures.length));
    }
    return figures;
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    return [];
  }
}

// Functions for Comments and UserRatings are now in their respective action files
// e.g., src/lib/actions/commentActions.ts and src/lib/actions/ratingActions.ts
// getUserRatingForFigure will be replaced by getUserRating from ratingActions.ts
// getCommentsForFigure will be replaced by getFigureCommentsWithRatings from commentActions.ts
