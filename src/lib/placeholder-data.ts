
import type { Figure, PerceptionOption, EmotionKey, AttitudeKey, StarValueAsString } from './types';
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

const defaultStarRatingCounts: Record<StarValueAsString, number> = {
  "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
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
            createdAtString = undefined;
        }
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
    
    // New detailed fields
    alias: data.alias || "",
    species: data.species || "",
    firstAppearance: data.firstAppearance || "",
    birthDateOrAge: data.birthDateOrAge || "",
    birthPlace: data.birthPlace || "",
    statusLiveOrDead: data.statusLiveOrDead || "",
    maritalStatus: data.maritalStatus || "",
    height: data.height || "",
    weight: data.weight || "",
    hairColor: data.hairColor || "",
    eyeColor: data.eyeColor || "",
    distinctiveFeatures: data.distinctiveFeatures || "",

    perceptionCounts: data.perceptionCounts || { ...defaultPerceptionCounts },
    attitudeCounts: data.attitudeCounts || { ...defaultAttitudeCounts },
    starRatingCounts: data.starRatingCounts || { ...defaultStarRatingCounts },
    createdAt: createdAtString,
    status: data.status || 'approved',
  };
};

export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    const figureDataWithDefaults = {
      ...figure,
      perceptionCounts: figure.perceptionCounts || { ...defaultPerceptionCounts },
      attitudeCounts: figure.attitudeCounts || { ...defaultAttitudeCounts },
      starRatingCounts: figure.starRatingCounts || { ...defaultStarRatingCounts },
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
    // Destructure all known fields to ensure only defined ones are passed.
    // This prevents accidental writes of undefined fields if they are not part of the partial update.
    const { 
        id, createdAt, nameLower, perceptionCounts, attitudeCounts, starRatingCounts,
        // List all other Figure fields here
        name, photoUrl, description, nationality, occupation, gender, alias, species,
        firstAppearance, birthDateOrAge, birthPlace, statusLiveOrDead, maritalStatus,
        height, weight, hairColor, eyeColor, distinctiveFeatures, status,
        ...rest // Should be empty if all fields are listed
    } = figure;

    const updatePayload: Partial<Figure> = {};

    // Only add fields to payload if they are explicitly provided in the `figure` partial object
    if (name !== undefined) updatePayload.name = name;
    if (photoUrl !== undefined) updatePayload.photoUrl = photoUrl;
    if (description !== undefined) updatePayload.description = description;
    if (nationality !== undefined) updatePayload.nationality = nationality;
    if (occupation !== undefined) updatePayload.occupation = occupation;
    if (gender !== undefined) updatePayload.gender = gender;
    if (alias !== undefined) updatePayload.alias = alias;
    if (species !== undefined) updatePayload.species = species;
    if (firstAppearance !== undefined) updatePayload.firstAppearance = firstAppearance;
    if (birthDateOrAge !== undefined) updatePayload.birthDateOrAge = birthDateOrAge;
    if (birthPlace !== undefined) updatePayload.birthPlace = birthPlace;
    if (statusLiveOrDead !== undefined) updatePayload.statusLiveOrDead = statusLiveOrDead;
    if (maritalStatus !== undefined) updatePayload.maritalStatus = maritalStatus;
    if (height !== undefined) updatePayload.height = height;
    if (weight !== undefined) updatePayload.weight = weight;
    if (hairColor !== undefined) updatePayload.hairColor = hairColor;
    if (eyeColor !== undefined) updatePayload.eyeColor = eyeColor;
    if (distinctiveFeatures !== undefined) updatePayload.distinctiveFeatures = distinctiveFeatures;
    if (status !== undefined) updatePayload.status = status;
    if (nameLower !== undefined) updatePayload.nameLower = nameLower;

    // Handle count objects carefully
    if (perceptionCounts) updatePayload.perceptionCounts = perceptionCounts;
    if (attitudeCounts) updatePayload.attitudeCounts = attitudeCounts;
    if (starRatingCounts) updatePayload.starRatingCounts = starRatingCounts;
    
    // Ensure no unknown fields are passed
    if (Object.keys(rest).length > 0) {
      console.warn("Unknown fields in updateFigureInFirestore:", rest);
    }

    await updateDoc(figureRef, updatePayload);
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
    const q = query(figuresCollectionRef );
    const querySnapshot = await getDocs(q);


    const figures: Figure[] = [];
    if (querySnapshot.empty) {
    } else {
      querySnapshot.forEach((docSnap) => {
        figures.push(mapDocToFigure(docSnap));
      });
    }
    return figures.sort((a, b) => a.name.localeCompare(b.name));
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
    return [];
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 4): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, limit(count) );
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
    figures.sort((a,b) => a.name.localeCompare(b.name));
    return figures.slice(0, count);
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    if (String(error).toLowerCase().includes("index") || String(error).toLowerCase().includes("permission")) {
        console.error("ACTION: Check BROWSER'S DEVELOPER CONSOLE (F12) for Firestore index creation links related to ordering by 'name' or listing permissions.");
    }
    return [];
  }
}

