
import type { Figure, PerceptionOption, EmotionKey } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, type DocumentData, Timestamp } from "firebase/firestore";

export const PERCEPTION_OPTIONS: PerceptionOption[] = [
  { key: 'neutral', label: 'Neutral', icon: Meh },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0,
  envidia: 0,
  tristeza: 0,
  miedo: 0,
  desagrado: 0,
  furia: 0,
};

// Helper to convert Firestore doc data to Figure, ensuring plain object
const mapDocToFigure = (docSnap: DocumentData): Figure => {
  const data = docSnap.data();
  let createdAtString: string | undefined = undefined;

  if (data.createdAt) {
    if (data.createdAt instanceof Timestamp) {
      createdAtString = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
      createdAtString = data.createdAt;
    } else if (typeof data.createdAt === 'object' && data.createdAt !== null && 
               typeof data.createdAt.seconds === 'number' && typeof data.createdAt.nanoseconds === 'number') {
      // It looks like a Timestamp-like object (e.g., from JSON or manual construction), try to convert it
      try {
        const date = new Date(data.createdAt.seconds * 1000 + data.createdAt.nanoseconds / 1000000);
        createdAtString = date.toISOString();
        // console.warn(`[mapDocToFigure] data.createdAt for ID ${docSnap.id} was an object but not an instanceof Timestamp. Attempted manual conversion.`);
      } catch (e) {
        console.error(`[mapDocToFigure] Failed to manually convert timestamp-like object for ID ${docSnap.id}:`, e);
        createdAtString = undefined; 
      }
    } else {
      // console.warn(`[mapDocToFigure] data.createdAt for ID ${docSnap.id} has an unexpected type: ${typeof data.createdAt}. Value:`, data.createdAt);
      createdAtString = undefined; 
    }
  }

  return {
    id: docSnap.id,
    name: data.name || "",
    nameLower: data.nameLower || (data.name ? data.name.toLowerCase() : ""),
    photoUrl: data.photoUrl || "",
    description: data.description || "",
    nationality: data.nationality || "",
    occupation: data.occupation || "",
    gender: data.gender || "",
    perceptionCounts: data.perceptionCounts || { ...defaultPerceptionCounts },
    createdAt: createdAtString,
  };
};

export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    const figureDataWithDefaults = {
      ...figure,
      perceptionCounts: figure.perceptionCounts || { ...defaultPerceptionCounts },
    };
    const { createdAt, ...figureDataForFirestore } = figureDataWithDefaults;


    await setDoc(figureRef, figureDataForFirestore);
    // console.log("Figure added to Firestore:", figureDataForFirestore);
  } catch (error) {
    console.error("Error adding figure to Firestore: ", error);
    throw error;
  }
};

export const updateFigureInFirestore = async (figure: Partial<Figure> & { id: string }): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    const { createdAt, ...figureDataToUpdate } = figure;
    await updateDoc(figureRef, { ...figureDataToUpdate });
    // console.log("Figure updated in Firestore:", figureDataToUpdate);
  } catch (error) {
    console.error("Error updating figure in Firestore: ", error);
    throw error;
  }
};

export const deleteFigureFromFirestore = async (figureId: string): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figureId);
    await deleteDoc(figureRef);
    // console.log("Figure deleted from Firestore:", figureId);
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
      return mapDocToFigure(figureSnap);
    } else {
      // console.log("No such figure in Firestore with ID:", id);
      return undefined;
    }
  } catch (error) {
    console.error("Error fetching figure from Firestore: ", error);
    throw error;
  }
};

export const getAllFiguresFromFirestore = async (): Promise<Figure[]> => {
  // console.log("Attempting to fetch all figures from Firestore...");
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, orderBy("name"));
    const querySnapshot = await getDocs(q);
    
    // console.log(`Firestore query returned ${querySnapshot.size} documents.`);

    const figures: Figure[] = [];
    if (querySnapshot.empty) {
      // console.log("No documents found in the 'figures' collection.");
    } else {
      querySnapshot.forEach((docSnap) => {
        figures.push(mapDocToFigure(docSnap));
      });
    }
    // console.log(`Successfully mapped ${figures.length} figures.`);
    return figures;
  } catch (error: any) {
    console.error("Error fetching all figures from Firestore. Message:", error.message);
    // console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return []; 
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 4): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, orderBy("name"), limit(count));
    const querySnapshot = await getDocs(q);
    let figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push(mapDocToFigure(docSnap));
    });

    if (figures.length < count && querySnapshot.size < count) { 
      const allFigures = await getAllFiguresFromFirestore();
      const additionalFigures = allFigures.filter(af => !figures.find(f => f.id === af.id));
      figures.push(...additionalFigures.slice(0, count - figures.length));
    }
    
    const uniqueFigureIds = new Set<string>();
    figures = figures.filter(figure => {
        if (uniqueFigureIds.has(figure.id)) {
            return false;
        }
        uniqueFigureIds.add(figure.id);
        return true;
    });

    return figures.slice(0, count);
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    return [];
  }
}
