
import type { Figure, PerceptionOption, EmotionKey, AttitudeKey, FigureComment, FigureUserRating } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, type DocumentData, Timestamp, where } from "firebase/firestore";

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

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0,
  fan: 0,
  simp: 0,
  hater: 0,
};

const defaultFigureRating = {
  averageRating: 0,
  totalRatings: 0,
};

const mapDocToFigure = (docSnap: DocumentData): Figure => {
  const data = docSnap.data();
  let createdAtString: string | undefined = undefined;

  if (data.createdAt) {
    if (data.createdAt instanceof Timestamp) {
      createdAtString = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
      createdAtString = data.createdAt;
    } else if (
      typeof data.createdAt === 'object' && data.createdAt !== null &&
      typeof data.createdAt.seconds === 'number' && typeof data.createdAt.nanoseconds === 'number'
    ) {
      try {
        const date = new Date(data.createdAt.seconds * 1000 + data.createdAt.nanoseconds / 1000000);
        if (!isNaN(date.getTime())) {
            createdAtString = date.toISOString();
        } else {
            createdAtString = undefined; // Invalid date from object
        }
      } catch (e) {
        // console.warn("Could not parse date from object:", data.createdAt, e);
        createdAtString = undefined;
      }
    } else {
    //   console.warn("Unparseable createdAt field type:", typeof data.createdAt, data.createdAt);
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
    attitudeCounts: data.attitudeCounts || { ...defaultAttitudeCounts },
    averageRating: data.averageRating || defaultFigureRating.averageRating,
    totalRatings: data.totalRatings || defaultFigureRating.totalRatings,
    createdAt: createdAtString,
  };
};

export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    const figureDataWithDefaults = {
      ...figure,
      perceptionCounts: figure.perceptionCounts || { ...defaultPerceptionCounts },
      attitudeCounts: figure.attitudeCounts || { ...defaultAttitudeCounts },
      averageRating: figure.averageRating || defaultFigureRating.averageRating,
      totalRatings: figure.totalRatings || defaultFigureRating.totalRatings,
    };
    const { createdAt, ...figureDataForFirestore } = figureDataWithDefaults;


    await setDoc(figureRef, figureDataForFirestore);
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
  } catch (error) {
    console.error("Error updating figure in Firestore: ", error);
    throw error;
  }
};

export const deleteFigureFromFirestore = async (figureId: string): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figureId);
    await deleteDoc(figureRef);
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
    // DIAGNOSTIC: Temporarily remove orderBy("name") to check for index issues.
    const q = query(figuresCollectionRef);
    const querySnapshot = await getDocs(q);


    const figures: Figure[] = [];
    if (querySnapshot.empty) {
        // console.log("No figures found in Firestore.");
    } else {
      querySnapshot.forEach((docSnap) => {
        figures.push(mapDocToFigure(docSnap));
      });
    }
    // If we removed orderBy, figures will not be sorted by name here.
    // This is for diagnosis. If it works, an index for orderBy("name") is needed.
    return figures;
  } catch (error: any) {
    console.error("Error fetching all figures from Firestore. Message:", error.message);
    if (String(error.message).toLowerCase().includes("permission")) {
        console.error("Firestore permission error: This usually means your Firestore Security Rules are blocking the 'list' operation on the 'figures' collection, OR the query (e.g., with orderBy('name')) requires a Firestore Index that is missing.");
        console.error("ACTION: 1. Double-check your Firestore Security Rules to ensure 'allow list: if (condition);' is correctly set for the '/figures' path.");
        console.error("ACTION: 2. VERY IMPORTANTLY, check the BROWSER'S DEVELOPER CONSOLE (F12) for a more detailed error message from Firestore. It often provides a DIRECT LINK to create the necessary index if one is missing. Click that link to create the index.");
    } else if (String(error.message).toLowerCase().includes("index")) {
        console.error("Firestore index error: The query (likely involving orderBy or where clauses) requires a composite index that is missing.");
        console.error("ACTION: Check the BROWSER'S DEVELOPER CONSOLE (F12) for a more detailed error message from Firestore. It usually provides a DIRECT LINK to create the necessary index. Click that link.");
    }
    return []; // Return empty array on error to prevent app crash
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 4): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    // DIAGNOSTIC: Temporarily remove orderBy("name")
    const q = query(figuresCollectionRef, limit(count));
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
    // If orderBy was removed, figures will not be sorted here either.
    return figures.slice(0, count);
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    if (String(error).toLowerCase().includes("index") || String(error).toLowerCase().includes("permission")) {
        console.error("ACTION: Check BROWSER'S DEVELOPER CONSOLE (F12) for Firestore index creation links related to ordering by 'name' or listing permissions.");
    }
    return [];
  }
}

// New function to fetch comments for a figure
export const getCommentsForFigure = async (figureId: string): Promise<FigureComment[]> => {
  try {
    const commentsCollectionRef = collection(db, 'figureComments');
    const q = query(commentsCollectionRef, where('figureId', '==', figureId), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const comments: FigureComment[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let createdAtString: string | undefined = undefined;
      let timestampValue: any = data.timestamp; 

      if (data.timestamp instanceof Timestamp) {
         createdAtString = data.timestamp.toDate().toISOString();
      } else if (typeof data.timestamp === 'string') { 
         createdAtString = data.timestamp;
      } else if (data.timestamp && typeof data.timestamp.seconds === 'number') { 
         createdAtString = new Date(data.timestamp.seconds * 1000 + (data.timestamp.nanoseconds || 0) / 1000000).toISOString();
      }

      comments.push({
        id: docSnap.id,
        figureId: data.figureId,
        userId: data.userId,
        username: data.username,
        userPhotoURL: data.userPhotoURL || null,
        commentText: data.commentText,
        ratingGiven: data.ratingGiven,
        timestamp: timestampValue,
        createdAt: createdAtString,
      } as FigureComment);
    });
    return comments;
  } catch (error) {
    console.error(`Error fetching comments for figure ${figureId}:`, error);
    return [];
  }
};

// New function to get a user's specific rating for a figure
export const getUserRatingForFigure = async (figureId: string, userId: string): Promise<FigureUserRating | null> => {
  try {
    const ratingDocRef = doc(db, 'figureUserRatings', `${userId}_${figureId}`);
    const docSnap = await getDoc(ratingDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        userId: data.userId,
        figureId: data.figureId,
        rating: data.rating,
        timestamp: data.timestamp, 
      } as FigureUserRating;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user rating for figure ${figureId} by user ${userId}:`, error);
    return null;
  }
};

