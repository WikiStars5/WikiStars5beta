
import type { Figure, PerceptionOption } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

export const PERCEPTION_OPTIONS: PerceptionOption[] = [
  { key: 'neutral', label: 'Neutral', icon: Meh },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];

// --- Firestore Figure Operations ---

export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    // Ensure the figure object passed already conforms to the Figure type, including nameLower.
    // averageRating, totalRatings, perceptionCounts are no longer part of Figure type.
    await setDoc(figureRef, figure);
    console.log("Figure added to Firestore:", figure);
  } catch (error) {
    console.error("Error adding figure to Firestore: ", error);
    throw error;
  }
};

export const updateFigureInFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    // The figure object should conform to Figure type, including nameLower.
    // Fields not in Figure type (like averageRating) won't be updated if not in the figure object.
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
    const q = query(figuresCollectionRef, orderBy("name")); // Order by original name for display
    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push({ id: docSnap.id, ...docSnap.data() } as Figure);
    });
    return figures;
  } catch (error) {
    console.error("Error fetching all figures from Firestore: ", error);
    return []; 
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 3): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    // totalRatings has been removed from Figure type. Sorting by name as a fallback.
    // Consider adding a specific 'isFeatured' field or similar for better featured logic.
    const q = query(figuresCollectionRef, orderBy("name"), limit(count));
    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push({ id: docSnap.id, ...docSnap.data() } as Figure);
    });
    
    // If not enough "featured" (name-sorted) figures, supplement with more from all figures
    if (figures.length < count) {
      const allFigures = await getAllFiguresFromFirestore(); // This already sorts by name
      const additionalFigures = allFigures.filter(af => !figures.find(f => f.id === af.id));
      figures.push(...additionalFigures.slice(0, count - figures.length));
    }
    return figures;
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    return [];
  }
}
