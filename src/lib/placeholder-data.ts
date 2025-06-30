import type { Figure, PerceptionOption, EmotionKey, AttitudeKey, StarValueAsString, FamilyMember } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, type DocumentData, Timestamp, where, type DocumentSnapshot, type QueryDocumentSnapshot, startAfter as firestoreStartAfter, endBefore as firestoreEndBefore } from "firebase/firestore";

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


export const mapDocToFigure = (docSnap: DocumentSnapshot | QueryDocumentSnapshot): Figure => {
  const data = docSnap.data() as DocumentData;
  const createdAtTimestamp = data.createdAt;
  
  const figureData: Figure = {
    id: docSnap.id,
    name: data.name || "",
    nameLower: data.nameLower || (data.name ? data.name.toLowerCase() : ""),
    photoUrl: data.photoUrl || "",
    coverPhotoUrl: data.coverPhotoUrl || "",
    description: data.description || "",
    nationality: data.nationality || "",
    occupation: data.occupation || "",
    gender: data.gender || "",
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
    commentCount: data.commentCount || 0,
    familyMembers: data.familyMembers || [],
    createdAt: createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function' 
                 ? createdAtTimestamp.toDate().toISOString() 
                 : undefined,
    status: data.status || 'approved',
    isFeatured: data.isFeatured || false,
  };

  return figureData;
};

export const ADMIN_FIGURES_PER_PAGE = 50;
export const PUBLIC_FIGURES_PER_PAGE = 50;

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
  const limitSize = PUBLIC_FIGURES_PER_PAGE;
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
      starRatingCounts: figure.starRatingCounts || { ...defaultStarRatingCounts },
      commentCount: figure.commentCount || 0,
      familyMembers: figure.familyMembers || [], // Ensure familyMembers is an array
      isFeatured: figure.isFeatured || false, // Ensure isFeatured is set
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
    const { 
        id, createdAt, nameLower, perceptionCounts, attitudeCounts, starRatingCounts, commentCount, familyMembers, 
        name, photoUrl, description, nationality, occupation, gender, alias, species,
        firstAppearance, birthDateOrAge, birthPlace, statusLiveOrDead, maritalStatus,
        height, weight, hairColor, eyeColor, distinctiveFeatures, status, isFeatured, coverPhotoUrl,
        ...rest
    } = figure;

    const updatePayload: Partial<Figure> = {};

    if (name !== undefined) updatePayload.name = name;
    if (photoUrl !== undefined) updatePayload.photoUrl = photoUrl;
    if (coverPhotoUrl !== undefined) updatePayload.coverPhotoUrl = coverPhotoUrl;
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
    if (commentCount !== undefined) updatePayload.commentCount = commentCount; 
    if (familyMembers !== undefined) updatePayload.familyMembers = familyMembers;
    if (isFeatured !== undefined) updatePayload.isFeatured = isFeatured;

    if (perceptionCounts) updatePayload.perceptionCounts = perceptionCounts;
    if (attitudeCounts) updatePayload.attitudeCounts = attitudeCounts;
    if (starRatingCounts) updatePayload.starRatingCounts = starRatingCounts;
    
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
  const figuresCollectionRef = collection(db, "figures");
  const allFigures: Figure[] = [];
  let lastVisible: QueryDocumentSnapshot | null = null;
  const batchSize = 100; // Fetch 100 figures at a time

  try {
    while (true) {
      // Use orderBy('name') for consistency with other paginated functions.
      // This is more robust and may require a Firestore index on the 'name' field.
      const q = lastVisible
        ? query(figuresCollectionRef, orderBy('name'), firestoreStartAfter(lastVisible), limit(batchSize))
        : query(figuresCollectionRef, orderBy('name'), limit(batchSize));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        break; // No more documents to fetch
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
    
    // The list is already sorted by name from the query.
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
    // Query for figures where isFeatured is true
    const q = query(
      figuresCollectionRef, 
      where("isFeatured", "==", true), 
      limit(count)
      // Consider adding an orderBy clause here if you want a specific order for featured figures
      // e.g., orderBy("name", "asc") or orderBy("featuredAt", "desc") if you add such a field
    );
    const querySnapshot = await getDocs(q);
    let figures: Figure[] = [];
    querySnapshot.forEach((docSnap) => {
      figures.push(mapDocToFigure(docSnap));
    });

    // If no figures are marked as featured, or less than 'count' are featured, 
    // this will return only those that are actually featured.
    // The old fallback logic to fill with any figures is removed to strictly show only featured ones.

    // Ensure unique figures if limit is high and there are duplicates (though unlikely with Firestore IDs)
    const uniqueFigureIds = new Set<string>();
    figures = figures.filter(figure => {
        if (uniqueFigureIds.has(figure.id)) {
            return false;
        }
        uniqueFigureIds.add(figure.id);
        return true;
    });
    
    // Optional: sort client-side if not ordered by Firestore and a specific order is desired
    // figures.sort((a,b) => a.name.localeCompare(b.name)); 

    return figures.slice(0, count); // Ensure we don't exceed the count due to client-side manipulations
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
  
  // Firestore 'in' queries are limited to 30 items per query.
  // We need to batch the requests if there are more than 30 IDs.
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
    
    // The order from Firestore 'in' query is not guaranteed, so we sort it
    // based on the original `ids` array order.
    const figureMap = new Map(figures.map(f => [f.id, f]));
    const sortedFigures = ids.map(id => figureMap.get(id)).filter((f): f is Figure => !!f);

    return sortedFigures;
  } catch (error) {
    console.error("Error fetching figures by IDs from Firestore: ", error);
    return []; // Return empty on error
  }
};
