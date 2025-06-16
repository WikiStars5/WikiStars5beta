
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
        createdAtString = date.toISOString();
      } catch (e) {
        createdAtString = undefined;
      }
    } else {
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
    const q = query(figuresCollectionRef, orderBy("name"));
    const querySnapshot = await getDocs(q);


    const figures: Figure[] = [];
    if (querySnapshot.empty) {
    } else {
      querySnapshot.forEach((docSnap) => {
        figures.push(mapDocToFigure(docSnap));
      });
    }
    return figures;
  } catch (error: any) {
    console.error("Error fetching all figures from Firestore. Message:", error.message);
    if (String(error.message).toLowerCase().includes("permission")) {
        console.error("Firestore permission error: Please check your Firestore Security Rules to ensure 'list' operations are allowed on the 'figures' collection. Also, check the browser's developer console for any messages about missing indexes, which might require a composite index for the orderBy('name') query.");
    } else if (String(error.message).toLowerCase().includes("index")) {
        console.error("Firestore index error: The query might require a composite index that is missing. Check the browser's developer console for a link to create it.");
    }
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
      if (data.timestamp instanceof Timestamp) {
         createdAtString = data.timestamp.toDate().toISOString();
      } else if (typeof data.timestamp === 'string') {
         createdAtString = data.timestamp;
      } else if (data.timestamp && typeof data.timestamp.seconds === 'number') {
         createdAtString = new Date(data.timestamp.seconds * 1000).toISOString();
      }

      comments.push({
        id: docSnap.id,
        figureId: data.figureId,
        userId: data.userId,
        username: data.username,
        userPhotoURL: data.userPhotoURL,
        commentText: data.commentText,
        ratingGiven: data.ratingGiven,
        timestamp: data.timestamp, // Keep original for sorting if needed, or serialize fully
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
        timestamp: data.timestamp, // Keep original or serialize
      } as FigureUserRating;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user rating for figure ${figureId} by user ${userId}:`, error);
    return null;
  }
};
