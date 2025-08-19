
import type { Figure, PerceptionOption, EmotionKey, AttitudeKey } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, type DocumentData, Timestamp, where, type DocumentSnapshot, type QueryDocumentSnapshot, startAfter as firestoreStartAfter, endBefore as firestoreEndBefore, runTransaction } from "firebase/firestore";

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

export const mapDocToFigure = (docSnap: DocumentSnapshot | QueryDocumentSnapshot): Figure => {
  const data = docSnap.data() as DocumentData;
  const createdAtTimestamp = data.createdAt;
  
  const figureData: Figure = {
    id: docSnap.id,
    name: data.name || "",
    nameLower: data.nameLower || (data.name ? data.name.toLowerCase() : ""),
    photoUrl: data.photoUrl || "",
    description: data.description || "",
    nationality: data.nationality || "",
    occupation: data.occupation || "",
    gender: data.gender || "",
    category: data.category || "",
    sportSubcategory: data.sportSubcategory || "",
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
    createdAt: createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function' 
                 ? createdAtTimestamp.toDate().toISOString() 
                 : undefined,
    status: data.status || 'approved',
    isFeatured: data.isFeatured || false,
  };

  return figureData;
};

export const ADMIN_FIGURES_PER_PAGE = 50;
export const PUBLIC_FIGURES_PER_PAGE = 12;

export async function getAdminFiguresList(options: {
  startAfter?: string;
  endBefore?: string;
}): Promise<{
  figures: Figure[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}> {
  const { startAfter, endBefore } = options;
  const figuresCollectionRef = collection(db, 'figures');

  const isPrev = !!endBefore;
  const limitSize = ADMIN_FIGURES_PER_PAGE;
  const order = isPrev ? 'desc' : 'asc';
  const cursorId = isPrev ? endBefore : startAfter;

  let q = query(figuresCollectionRef, orderBy('name', order), limit(limitSize + 1));

  if (cursorId) {
    const cursorDoc = await getDoc(doc(db, 'figures', cursorId));
    if (cursorDoc.exists()) {
      q = isPrev 
        ? query(figuresCollectionRef, orderBy('name', order), firestoreStartAfter(cursorDoc), limit(limitSize + 1)) 
        : query(figuresCollectionRef, orderBy('name', order), firestoreStartAfter(cursorDoc), limit(limitSize + 1));
    }
  }

  const snapshot = await getDocs(q);
  const figures = snapshot.docs.map(mapDocToFigure);

  const hasMore = figures.length > limitSize;
  if (hasMore) {
    figures.pop();
  }

  if (isPrev) {
    figures.reverse();
  }

  const hasPrevPage = isPrev ? hasMore : !!startAfter;
  const hasNextPage = isPrev ? !!endBefore : hasMore;
  
  const startCursor = figures.length > 0 ? figures[0].id : null;
  const endCursor = figures.length > 0 ? figures[figures.length - 1].id : null;

  return { figures, hasPrevPage, hasNextPage, startCursor, endCursor };
}

export async function getPublicFiguresList(options: {
  startAfter?: string;
  endBefore?: string;
  limit?: number;
}): Promise<{
  figures: Figure[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}> {
  const { startAfter, endBefore } = options;
  const figuresCollectionRef = collection(db, 'figures');

  const isPrev = !!endBefore;
  const limitSize = options.limit || PUBLIC_FIGURES_PER_PAGE;
  const order = isPrev ? 'desc' : 'asc';
  const cursorId = isPrev ? endBefore : startAfter;

  let q = query(figuresCollectionRef, orderBy('name', order), limit(limitSize + 1));

  if (cursorId) {
    const cursorDoc = await getDoc(doc(db, 'figures', cursorId));
    if (cursorDoc.exists()) {
      q = query(figuresCollectionRef, orderBy('name', order), firestoreStartAfter(cursorDoc), limit(limitSize + 1));
    }
  }

  const snapshot = await getDocs(q);
  const figures = snapshot.docs.map(mapDocToFigure);

  const hasMore = figures.length > limitSize;
  if (hasMore) {
    figures.pop();
  }

  if (isPrev) {
    figures.reverse();
  }

  const hasPrevPage = isPrev ? hasMore : !!startAfter;
  const hasNextPage = isPrev ? !!endBefore : hasMore;
  
  const startCursor = figures.length > 0 ? figures[0].id : null;
  const endCursor = figures.length > 0 ? figures[figures.length - 1].id : null;

  return { figures, hasPrevPage, hasNextPage, startCursor, endCursor };
}


export const addFigureToFirestore = async (figure: Figure): Promise<void> => {
  try {
    const figureRef = doc(db, "figures", figure.id);
    const figureDataWithDefaults = {
      ...figure,
      perceptionCounts: figure.perceptionCounts || { ...defaultPerceptionCounts },
      attitudeCounts: figure.attitudeCounts || { ...defaultAttitudeCounts },
      isFeatured: figure.isFeatured || false, 
    };
    const { createdAt, ...figureDataForFirestore } = figureDataWithDefaults;


    await setDoc(figureRef, figureDataForFirestore);
  } catch (error) {
    console.error("Error adding figure to Firestore: ", error);
    throw error;
  }
};

export const updateFigureInFirestore = async (figure: Partial<Figure> & { id: string }): Promise<void> => {
  const figureRef = doc(db, "figures", figure.id);
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(figureRef);
      if (!sfDoc.exists()) {
        throw "Document does not exist!";
      }

      // Destructure all known fields to separate them from the rest
      const { 
          id, createdAt, nameLower, perceptionCounts, attitudeCounts, 
          name, photoUrl, description, nationality, occupation, gender, alias, species,
          firstAppearance, birthDateOrAge, birthPlace, statusLiveOrDead, maritalStatus,
          height, weight, hairColor, eyeColor, distinctiveFeatures, status, isFeatured,
          category, sportSubcategory, ...rest
      } = figure;

      const updatePayload: { [key: string]: any } = {};

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
      if (isFeatured !== undefined) updatePayload.isFeatured = isFeatured;
      if (category !== undefined) updatePayload.category = category;
      if (sportSubcategory !== undefined) updatePayload.sportSubcategory = sportSubcategory;
      if (perceptionCounts) updatePayload.perceptionCounts = perceptionCounts;
      if (attitudeCounts) updatePayload.attitudeCounts = attitudeCounts;
      
      if (Object.keys(rest).length > 0) {
        console.warn("Unknown fields in updateFigureInFirestore:", rest);
      }

      transaction.update(figureRef, updatePayload);
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw new Error("La actualización falló porque alguien más editó el perfil. Por favor, recarga la página e intenta de nuevo.");
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
  const figuresCollectionRef = collection(db, "figures");
  const allFigures: Figure[] = [];
  let lastVisible: QueryDocumentSnapshot | null = null;
  const batchSize = 100; // Fetch 100 figures at a time

  try {
    while (true) {
      const q = lastVisible
        ? query(figuresCollectionRef, orderBy('name'), firestoreStartAfter(lastVisible), limit(batchSize))
        : query(figuresCollectionRef, orderBy('name'), limit(batchSize));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        break; 
      }

      querySnapshot.forEach((docSnap) => {
        try {
          allFigures.push(mapDocToFigure(docSnap));
        } catch (e) {
            console.error(`Error mapping document ${docSnap.id}, skipping.`, e)
        }
      });

      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      if (querySnapshot.docs.length < batchSize) {
        break;
      }
    }
    
    return allFigures;

  } catch (error: any) {
    console.error("Error fetching all figures from Firestore for sitemap. Message:", error.message);
    if (String(error.message).toLowerCase().includes("permission")) {
      console.error("Firestore permission error: This usually means your Firestore Security Rules are blocking the 'list' operation on the 'figures' collection.");
      console.error("ACTION: Double-check your Firestore Security Rules to ensure 'allow list: if true;' is correctly set for the '/figures/{figureId}' path.");
    } else if (String(error.message).toLowerCase().includes("index")) {
        console.error("Firestore index error: The query (likely involving orderBy('name')) requires a composite index that is missing.");
        console.error("ACTION: Check the build logs or browser console for a more detailed error message from Firestore. It may provide a DIRECT LINK to create the necessary index in your Firebase Console.");
    }
    return []; // Return empty on error
  }
};

export const getFeaturedFiguresFromFirestore = async (count: number = 4): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(
      figuresCollectionRef, 
      where("isFeatured", "==", true), 
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    let figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push(mapDocToFigure(docSnap));
    });

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
    if (String(error).toLowerCase().includes("index") || String(error).toLowerCase().includes("permission")) {
        console.error("ACTION: Check BROWSER'S DEVELOPER CONSOLE (F12) for Firestore index creation links related to querying by 'isFeatured' or listing permissions.");
    }
    return [];
  }
}


export const getFiguresByIds = async (ids: string[]): Promise<Figure[]> => {
  if (!ids || ids.length === 0) {
    return [];
  }
  
  const figures: Figure[] = [];
  const batches: string[][] = [];
  
  for (let i = 0; i < ids.length; i += 30) {
    batches.push(ids.slice(i, i + 30));
  }

  try {
    for (const batch of batches) {
      if (batch.length > 0) {
        const figuresCollectionRef = collection(db, "figures");
        const q = query(figuresCollectionRef, where('__name__', 'in', batch));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          figures.push(mapDocToFigure(docSnap));
        });
      }
    }
    
    const figureMap = new Map(figures.map(f => [f.id, f]));
    const sortedFigures = ids.map(id => figureMap.get(id)).filter((f): f is Figure => !!f);

    return sortedFigures;
  } catch (error) {
    console.error("Error fetching figures by IDs from Firestore: ", error);
    return []; // Return empty on error
  }
};
