

import type { Figure, PerceptionOption, EmotionKey, AttitudeKey, Comment, LocalUserStreak, Streak, StreakWithProfile, UserProfile, Attitude, EmotionVote, RatingVote, RatingValue, YoutubeShort, TiktokVideo, InstagramPost } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, type DocumentData, Timestamp, where, type QueryDocumentSnapshot, startAfter as firestoreStartAfter, endBefore as firestoreEndBefore, runTransaction, addDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove, getCountFromServer } from "firebase/firestore";
import { isSameDay, isYesterday } from 'date-fns';
import { GENDER_OPTIONS } from '@/config/genderOptions';

export const PERCEPTION_OPTIONS: PerceptionOption[] = [
  { key: 'neutral', label: 'Neutral', icon: Meh },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0,
  fan: 0,
  simp: 0,
  hater: 0,
};

const defaultRatingCounts: Record<string, number> = {
  "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0
};

export const mapDocToFigure = (docSnap: DocumentData): Figure => {
  const data = docSnap.data() as DocumentData;
  const createdAtTimestamp = data.createdAt;

  const figureData: Figure = {
    id: docSnap.id,
    name: data.name || "",
    nameSearch: data.nameSearch || (data.name ? data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""),
    nameKeywords: data.nameKeywords || [],
    profileType: data.profileType || 'character', // Default to character for older data
    photoUrl: data.photoUrl || "",
    description: data.description || "",
    nationality: data.nationality || "",
    nationalityCode: data.nationalityCode || "",
    occupation: data.occupation || "",
    gender: data.gender || "",
    category: data.category || "",
    sportSubcategory: data.sportSubcategory || "",
    hashtags: data.hashtags || [],
    hashtagsLower: data.hashtagsLower || [],
    hashtagKeywords: data.hashtagKeywords || [],
    alias: data.alias || "",
    species: data.species || "",
    firstAppearance: data.firstAppearance || "",
    birthDateOrAge: data.birthDateOrAge || "",
    age: data.age,
    birthPlace: data.birthPlace || "",
    statusLiveOrDead: data.statusLiveOrDead || "",
    maritalStatus: data.maritalStatus || "",
    height: data.height || "",
    heightCm: data.heightCm,
    weight: data.weight || "",
    hairColor: data.hairColor || "",
    eyeColor: data.eyeColor || "",
    distinctiveFeatures: data.distinctiveFeatures || "",
    socialLinks: data.socialLinks || {},
    relatedFigureIds: data.relatedFigureIds || [],
    perceptionCounts: data.perceptionCounts || { ...defaultPerceptionCounts },
    attitudeCounts: data.attitudeCounts || { ...defaultAttitudeCounts },
    ratingCounts: data.ratingCounts || { ...defaultRatingCounts },
    createdAt: createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function' 
                 ? createdAtTimestamp.toDate().toISOString() 
                 : (createdAtTimestamp ? new Date(createdAtTimestamp).toISOString() : new Date().toISOString()),
    status: data.status || 'approved',
    isFeatured: data.isFeatured || false,
    deathDate: data.deathDate,
    mediaSubcategory: data.mediaSubcategory,
    mediaGenre: data.mediaGenre,
    releaseDate: data.releaseDate,
    director: data.director,
    studio: data.studio,
    developer: data.developer,
    publisher: data.publisher,
    platforms: data.platforms,
    author: data.author,
    artist: data.artist,
    founder: data.founder,
    industry: data.industry,
    websiteUrl: data.websiteUrl,
    creationMethod: data.creationMethod,
    isCommunityVerified: data.isCommunityVerified,
    manualVerificationExpiresAt: data.manualVerificationExpiresAt
  };

  return figureData;
};

export const ADMIN_FIGURES_PER_PAGE = 50;
export const PUBLIC_FIGURES_PER_PAGE = 12;

export async function getFiguresCount(): Promise<number> {
    try {
        const figuresCollectionRef = collection(db, 'figures');
        // This query counts all figures, regardless of status, as it's for the admin panel.
        const snapshot = await getCountFromServer(figuresCollectionRef);
        return snapshot.data().count;
    } catch (error) {
        console.error("Error getting figures count:", error);
        return 0;
    }
}


export async function getAdminFiguresList(options: { startAfter?: string; endBefore?: string; }): Promise<{ figures: Figure[]; hasPrevPage: boolean; hasNextPage: boolean; startCursor: string | null; endCursor: string | null; }> {
  const { startAfter, endBefore } = options;
  const figuresCollectionRef = collection(db, 'figures');
  const isPrev = !!endBefore;
  
  let q;
  let cursorDoc: QueryDocumentSnapshot | undefined;

  try {
    if (isPrev && endBefore) {
        const docSnap = await getDoc(doc(db, 'figures', endBefore));
        if (docSnap.exists()) cursorDoc = docSnap;
    } else if (!isPrev && startAfter) {
        const docSnap = await getDoc(doc(db, 'figures', startAfter));
        if (docSnap.exists()) cursorDoc = docSnap;
    }
    
    if (isPrev && cursorDoc) {
        q = query(
            figuresCollectionRef,
            orderBy('name', 'desc'),
            firestoreStartAfter(cursorDoc),
            limit(ADMIN_FIGURES_PER_PAGE)
        );
    } else if (!isPrev && cursorDoc) {
        q = query(
            figuresCollectionRef,
            orderBy('name', 'asc'),
            firestoreStartAfter(cursorDoc),
            limit(ADMIN_FIGURES_PER_PAGE)
        );
    } else {
        q = query(
            figuresCollectionRef,
            orderBy('name', 'asc'),
            limit(ADMIN_FIGURES_PER_PAGE)
        );
    }
    
    const snapshot = await getDocs(q);
    
    let figures = snapshot.docs.map(mapDocToFigure);

    if (isPrev) {
        figures.reverse();
    }
    
    // Check if there are more pages
    const hasNextPage = figures.length === ADMIN_FIGURES_PER_PAGE;
    // hasPrevPage is true if we are not on the first page
    const hasPrevPage = !!startAfter;

    const startCursor = figures.length > 0 ? figures[0].id : null;
    const endCursor = figures.length > 0 ? figures[figures.length - 1].id : null;

    return { figures, hasPrevPage, hasNextPage, startCursor, endCursor };
  } catch (error: any) {
    console.error("Error fetching admin figures:", error);
    if (String(error).includes('permission-denied')) {
        throw new Error("Permiso denegado por las reglas de seguridad de Firestore. Asegúrate de que el administrador tiene permiso de lectura en la colección 'figures'.");
    }
    throw new Error("No se pudo cargar la lista de figuras desde Firestore.");
  }
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
  
  let q;
  let cursorDoc: QueryDocumentSnapshot | undefined;

  try {
    // Validate the cursor document exists before using it
    if (isPrev && endBefore) {
        const docSnap = await getDoc(doc(db, 'figures', endBefore));
        if (docSnap.exists()) cursorDoc = docSnap;
    } else if (!isPrev && startAfter) {
        const docSnap = await getDoc(doc(db, 'figures', startAfter));
        if (docSnap.exists()) cursorDoc = docSnap;
    }
    
    // We filter by 'approved' status to simplify the query and avoid needing a complex index.
    // The main list of figures for the public should always be approved.
    const baseQueryConstraints = [where("status", "==", "approved")];

    if (isPrev && cursorDoc) {
        q = query(
            figuresCollectionRef,
            orderBy('name', 'asc'),
            ...baseQueryConstraints,
            firestoreEndBefore(cursorDoc),
            limit(limitSize)
        );
    } else if (!isPrev && cursorDoc) {
        q = query(
            figuresCollectionRef,
            orderBy('name', 'asc'),
            ...baseQueryConstraints,
            firestoreStartAfter(cursorDoc),
            limit(limitSize)
        );
    } else {
        q = query(
            figuresCollectionRef,
            orderBy('name', 'asc'),
            ...baseQueryConstraints,
            limit(limitSize)
        );
    }
    
    const snapshot = await getDocs(q);
    
    let figures = snapshot.docs.map(mapDocToFigure);

    if (isPrev) {
        figures.reverse();
    }
    
    const hasNextPage = figures.length === limitSize;
    const hasPrevPage = !!startAfter;

    const startCursor = figures.length > 0 ? figures[0].id : null;
    const endCursor = figures.length > 0 ? figures[figures.length - 1].id : null;

    return { figures, hasPrevPage, hasNextPage, startCursor, endCursor };
  } catch (error) {
    console.error("Error fetching public figures:", error);
    return { figures: [], hasPrevPage: false, hasNextPage: false, startCursor: null, endCursor: null };
  }
}



export async function addFigureToFirestore(figure: Partial<Figure>): Promise<void> {
  const { id, ...figureData } = figure;
  const finalId = id || (figure.name ? slugify(figure.name, { lower: true, strict: true }) : undefined);
  if (!finalId) throw new Error("Figure name is required to create a new profile.");

  const figureRef = doc(db, 'figures', finalId);
  const dataWithTimestamp = {
    ...figureData,
    createdAt: serverTimestamp(),
  };
  await setDoc(figureRef, dataWithTimestamp, { merge: true });
}

export async function updateFigureInFirestore(figure: Partial<Figure> & { id: string }): Promise<void> {
  const { id, ...figureData } = figure;
  const figureRef = doc(db, 'figures', id);
  await setDoc(figureRef, figureData, { merge: true });
}

export async function toggleFeaturedStatus(figureId: string, isFeatured: boolean): Promise<void> {
    // This function is now deprecated and its logic has been moved to a Cloud Function.
    // The client-side form should call the 'toggleFeaturedStatus' Cloud Function.
    console.warn("Client-side toggleFeaturedStatus is deprecated.");
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
  
  try {
    // This query is intentionally simple to avoid needing complex indexes for this specific use case.
    const q = query(figuresCollectionRef, orderBy('name'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
        const figure = mapDocToFigure(docSnap);
        // We filter in memory for 'approved' status
        if (figure.status === 'approved') {
            allFigures.push(figure);
        }
    });
    
    return allFigures;

  } catch (error: any) {
    console.error("Error fetching all figures from Firestore. Message:", error.message);
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


export const getFeaturedFiguresFromFirestore = async (count: number = 10): Promise<Figure[]> => {
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(
      figuresCollectionRef, 
      where("isFeatured", "==", true),
      where("status", "==", "approved"),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const figures = querySnapshot.docs.map(mapDocToFigure);
    return figures;
  } catch (error) {
    console.error("Error fetching featured figures from Firestore: ", error);
    if (String(error).toLowerCase().includes("index") || String(error).toLowerCase().includes("permission")) {
        console.error("ACTION: Check BROWSER'S DEVELOPER CONSOLE (F12) for Firestore index creation links related to querying by 'isFeatured' or listing permissions.");
    }
    return [];
  }
}


export const getFiguresByIds = async (ids: string[]): Promise<Figure[]> => {
  // Filter out any undefined, null, or empty string IDs before processing.
  const validIds = ids.filter(id => typeof id === 'string' && id.trim() !== '');

  if (validIds.length === 0) {
    return [];
  }
  
  const figures: Figure[] = [];
  const batches: string[][] = [];
  
  // Batch the valid IDs
  for (let i = 0; i < validIds.length; i += 30) {
    batches.push(validIds.slice(i, i + 30));
  }

  try {
    for (const batch of batches) {
      // The batch is guaranteed to have valid strings here.
      const figuresCollectionRef = collection(db, "figures");
      const q = query(figuresCollectionRef, where('__name__', 'in', batch));
      const querySnapshot = await getDocs(q);
        
      querySnapshot.forEach((docSnap) => {
        figures.push(mapDocToFigure(docSnap));
      });
    }
    
    const figureMap = new Map(figures.map(f => [f.id, f]));
    // Sort based on the original validIds array to maintain order
    const sortedFigures = validIds.map(id => figureMap.get(id)).filter((f): f is Figure => !!f);

    return sortedFigures;
  } catch (error) {
    console.error("Error fetching figures by IDs from Firestore: ", error);
    return []; // Return empty on error
  }
};


export const getFiguresByHashtag = async (hashtag: string): Promise<Figure[]> => {
  const figures: Figure[] = [];
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, where('hashtagKeywords', 'array-contains', hashtag), where("status", "==", "approved"), limit(50));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      figures.push(mapDocToFigure(docSnap));
    });
    return figures;
  } catch (error) {
    console.error(`Error fetching figures for hashtag "${hashtag}":`, error);
    return [];
  }
};


export const getFiguresByNationality = async (nationalityCode: string): Promise<Figure[]> => {
  const figures: Figure[] = [];
  try {
    const figuresCollectionRef = collection(db, "figures");
    const q = query(figuresCollectionRef, where('nationalityCode', '==', nationalityCode), where("status", "==", "approved"), limit(50));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      figures.push(mapDocToFigure(docSnap));
    });
    return figures;
  } catch (error) {
    console.error(`Error fetching figures for nationality "${nationalityCode}":`, error);
    return [];
  }
};


// --- Comments ---

export const mapDocToComment = (docSnap: DocumentData): Comment => {
  const data = docSnap.data() as DocumentData;
  return {
    id: docSnap.id,
    figureId: data.figureId,
    authorId: data.authorId,
    authorName: data.authorName,
    authorPhotoUrl: data.authorPhotoUrl,
    authorGender: data.authorGender,
    authorCountry: data.authorCountry,
    authorCountryCode: data.authorCountryCode,
    text: data.text,
    rating: data.rating,
    createdAt: data.createdAt,
    lastEditedAt: data.lastEditedAt,
    likes: data.likes || [],
    likeCount: data.likeCount || 0,
    dislikes: data.dislikes || [],
    dislikeCount: data.dislikeCount || 0,
    replies: [], // Replies are fetched separately
    replyCount: data.replyCount || 0,
    isAnonymous: data.isAnonymous ?? false,
  };
};

export async function addComment(
  figureId: string,
  authorData: { 
    id: string; 
    name: string; 
    photoUrl: string | null;
    gender: string;
    country: string;
    countryCode: string;
    isAnonymous: boolean;
  },
  text: string,
  rating: RatingValue
): Promise<string> {
    const figureDocRef = doc(db, 'figures', figureId);
    const newCommentRef = doc(collection(db, `figures/${figureId}/comments`));
    const userRatingDocRef = doc(db, 'userRatings', `${authorData.id}_${figureId}`);

    const newCommentData: Omit<Comment, 'id' | 'replies'> & { createdAt: any } = {
        figureId: figureId,
        authorId: authorData.id,
        authorName: authorData.name,
        authorPhotoUrl: authorData.photoUrl || null,
        authorGender: authorData.gender,
        authorCountry: authorData.country,
        authorCountryCode: authorData.countryCode,
        text: text,
        rating: rating,
        createdAt: serverTimestamp(),
        likes: [],
        likeCount: 0,
        dislikes: [],
        dislikeCount: 0,
        replyCount: 0,
        isAnonymous: authorData.isAnonymous,
    };

    await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureDocRef);
        if (!figureDoc.exists()) throw new Error("Figure document not found.");

        const userRatingDoc = await transaction.get(userRatingDocRef);
        const previousRating = userRatingDoc.exists() ? userRatingDoc.data().rating as RatingValue : null;
        
        const newRatingCounts = { ...defaultRatingCounts, ...figureDoc.data().ratingCounts };

        if (previousRating !== null) {
            newRatingCounts[previousRating] = Math.max(0, (newRatingCounts[previousRating] || 0) - 1);
        }
        newRatingCounts[rating] = (newRatingCounts[rating] || 0) + 1;

        transaction.update(figureDocRef, { ratingCounts: newRatingCounts });
        transaction.set(newCommentRef, newCommentData);
        transaction.set(userRatingDocRef, { 
            userId: authorData.id,
            figureId: figureId,
            rating: rating,
            addedAt: serverTimestamp() 
        });
    });

    return newCommentRef.id;
}


export async function addReply(
  parentPath: string,
  authorData: {
    id: string;
    name: string;
    photoUrl: string | null;
    gender: string;
    country: string;
    countryCode: string;
    isAnonymous: boolean;
  },
  text: string
): Promise<void> {
  const parentRef = doc(db, parentPath);
  const repliesCollectionRef = collection(db, `${parentPath}/replies`);
  const newReplyRef = doc(repliesCollectionRef);

  // Extract figureId from the parent path
  const pathSegments = parentPath.split('/');
  const figureId = pathSegments[1];

  const replyData: Omit<Comment, 'id' | 'replies'> & { createdAt: any } = {
    figureId: figureId,
    authorId: authorData.id,
    authorName: authorData.name,
    authorPhotoUrl: authorData.photoUrl || null,
    authorGender: authorData.gender || '',
    authorCountry: authorData.country || '',
    authorCountryCode: authorData.countryCode || '',
    text: text,
    createdAt: serverTimestamp(),
    likes: [],
    likeCount: 0,
    dislikes: [],
    dislikeCount: 0,
    replyCount: 0,
    isAnonymous: authorData.isAnonymous,
  };

  await runTransaction(db, async (transaction) => {
    const parentDoc = await transaction.get(parentRef);
    if (!parentDoc.exists()) throw new Error("Parent comment does not exist.");

    // 1. Update parent comment's reply count
    transaction.update(parentRef, { replyCount: (parentDoc.data().replyCount || 0) + 1 });

    // 2. Set the new reply document
    transaction.set(newReplyRef, replyData);
  });
}


export async function updateComment(documentPath: string, newText: string): Promise<void> {
    const commentRef = doc(db, documentPath);
    await updateDoc(commentRef, {
        text: newText,
        lastEditedAt: serverTimestamp(),
    });
}


export async function toggleLikeComment(
  documentPath: string, 
  userId: string
): Promise<boolean> {
  const commentRef = doc(db, documentPath);
  let isLiked = false;

  await runTransaction(db, async (transaction) => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists()) throw new Error("Comment does not exist!");
    
    const commentData = commentDoc.data();
    const likes: string[] = commentData.likes || [];
    const dislikes: string[] = commentData.dislikes || [];
    const updateData: any = {};
    
    if (likes.includes(userId)) {
      updateData.likes = arrayRemove(userId);
      updateData.likeCount = Math.max(0, (commentData.likeCount || 0) - 1);
      isLiked = false;
    } else {
      updateData.likes = arrayUnion(userId);
      updateData.likeCount = (commentData.likeCount || 0) + 1;
      isLiked = true;
      if (dislikes.includes(userId)) {
        updateData.dislikes = arrayRemove(userId);
        updateData.dislikeCount = Math.max(0, (commentData.dislikeCount || 0) - 1);
      }
      
    }
    
    transaction.update(commentRef, updateData);
  });

  return isLiked;
}


export async function toggleDislikeComment(
  documentPath: string,
  userId: string
): Promise<boolean> {
  const commentRef = doc(db, documentPath);
  let isDisliked = false;

  await runTransaction(db, async (transaction) => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists()) throw new Error("Comment does not exist!");
    
    const commentData = commentDoc.data();
    const likes: string[] = commentData.likes || [];
    const dislikes: string[] = commentData.dislikes || [];
    const updateData: any = {};

    if (dislikes.includes(userId)) {
      updateData.dislikes = arrayRemove(userId);
      updateData.dislikeCount = Math.max(0, (commentData.dislikeCount || 0) - 1);
      isDisliked = false;
    } else {
      updateData.dislikes = arrayUnion(userId);
      updateData.dislikeCount = (commentData.dislikeCount || 0) + 1;
      isDisliked = true;
      if (likes.includes(userId)) {
        updateData.likes = arrayRemove(userId);
        updateData.likeCount = Math.max(0, (commentData.likeCount || 0) - 1);
      }
    }
    
    transaction.update(commentRef, updateData);
  });

  return isDisliked;
}

async function deleteRepliesRecursive(collectionPath: string, batch: any) {
  const repliesRef = collection(db, collectionPath);
  const snapshot = await getDocs(repliesRef);
  if (snapshot.empty) {
    return;
  }
  for (const replyDoc of snapshot.docs) {
    batch.delete(replyDoc.ref);
    await deleteRepliesRecursive(`${collectionPath}/${replyDoc.id}/replies`, batch);
  }
}

export async function deleteComment(documentPath: string): Promise<void> {
  const commentRef = doc(db, documentPath);

  await runTransaction(db, async (transaction) => {
    // --- Phase 1: Reads ---
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists()) {
      return; // Comment already deleted, nothing to do.
    }
    
    const commentData = commentDoc.data();
    const pathParts = documentPath.split('/');
    const isReply = pathParts.length > 4 && pathParts[pathParts.length - 2] === 'replies';
    
    let parentRef: any, parentDoc: any, userRatingDoc: any, figureDoc: any;
    
    if (isReply) {
      parentRef = doc(db, pathParts.slice(0, -2).join('/'));
      parentDoc = await transaction.get(parentRef);
    }
    
    const rating = commentData.rating as RatingValue | undefined;
    const authorId = commentData.authorId as string | undefined;
    const figureId = commentData.figureId as string | undefined;
    
    let userRatingDocRef: any;
    if (authorId && figureId) {
        userRatingDocRef = doc(db, 'userRatings', `${authorId}_${figureId}`);
        userRatingDoc = await transaction.get(userRatingDocRef);
    }

    let figureRef: any;
    if (figureId) {
        figureRef = doc(db, 'figures', figureId);
        figureDoc = await transaction.get(figureRef);
    }
    
    // --- Phase 2: Writes ---
    
    // Adjust rating counts if applicable (and if it's not a reply)
    if (!isReply && rating !== undefined && userRatingDoc?.exists() && userRatingDoc.data().rating === rating) {
      if (figureDoc?.exists()) {
        const figureData = figureDoc.data();
        const currentCounts = figureData.ratingCounts || { ...defaultRatingCounts };
        const newCount = Math.max(0, (currentCounts[rating] || 0) - 1);
        const newRatingCounts = { ...currentCounts, [rating]: newCount };
        transaction.update(figureRef, { ratingCounts: newRatingCounts });
      }
      if (userRatingDocRef) {
          transaction.delete(userRatingDocRef);
      }
    }
    
    // Decrement parent's reply count if this is a reply
    if (isReply && parentDoc?.exists()) {
      const newReplyCount = Math.max(0, (parentDoc.data().replyCount || 0) - 1);
      transaction.update(parentRef, { replyCount: newReplyCount });
    }
    
    // Finally, delete the comment itself
    transaction.delete(commentRef);
  });

  // After the transaction, recursively delete sub-collections of the deleted comment
  const batch = writeBatch(db);
  await deleteRepliesRecursive(`${documentPath}/replies`, batch);
  await batch.commit();
}


// --- Streaks ---

export async function updateStreak(
  figureId: string,
  authorData: {
    id: string;
    name: string;
    gender: string;
    countryCode: string;
    isAnonymous: boolean;
  }
): Promise<number | null> {
  const streakRef = doc(db, `figures/${figureId}/streaks`, authorData.id);
  let streakToAnimate: number | null = null;
  const now = new Date();

  try {
    await runTransaction(db, async (transaction) => {
      const streakDoc = await transaction.get(streakRef);
      
      let currentStreak = 1;
      let shouldAnimate = false;

      if (streakDoc.exists()) {
        const data = streakDoc.data();
        const lastCommentDate = (data.lastCommentDate as Timestamp).toDate();
        
        if (isYesterday(lastCommentDate)) {
          currentStreak = (data.currentStreak || 0) + 1;
          shouldAnimate = true;
        } else if (isSameDay(now, lastCommentDate)) {
          currentStreak = data.currentStreak || 1;
          shouldAnimate = false;
        } else {
          currentStreak = 1;
          shouldAnimate = true;
        }
      } else {
        shouldAnimate = true;
      }
      
      if (shouldAnimate) {
        streakToAnimate = currentStreak;
      }

      let attitude: AttitudeKey | null = null;
      let emotion: EmotionKey | null = null;
      if (typeof window !== 'undefined') {
        const localAttitudes: Attitude[] = JSON.parse(localStorage.getItem(`wikistars5-attitudes-${authorData.id}`) || '[]');
        attitude = localAttitudes.find(a => a.figureId === figureId)?.attitude || null;
        
        const localEmotions: EmotionVote[] = JSON.parse(localStorage.getItem(`wikistars5-emotions-${authorData.id}`) || '[]');
        emotion = localEmotions.find(e => e.figureId === figureId)?.emotion || null;
      }
      
      const dataToSet: Partial<Streak> = {
        userId: authorData.id,
        currentStreak: currentStreak,
        lastCommentDate: Timestamp.fromDate(now),
        isAnonymous: authorData.isAnonymous,
        attitude,
        emotion,
      };

      if (authorData.isAnonymous) {
        dataToSet.username = authorData.name;
        dataToSet.gender = authorData.gender;
        dataToSet.countryCode = authorData.countryCode;
      }

      transaction.set(streakRef, dataToSet, { merge: true });
    });
  } catch (error) {
    console.error("Firestore streak update transaction failed: ", error);
    return null;
  }

  return streakToAnimate;
}

export async function getTopStreaksForFigure(figureId: string, count: number = 10): Promise<StreakWithProfile[]> {
  const streaksRef = collection(db, `figures/${figureId}/streaks`);
  const today = new Date();
  
  try {
    const allStreaksQuery = query(streaksRef);
    const allStreaksSnapshot = await getDocs(allStreaksQuery);

    let activeStreaks: Streak[] = [];
    allStreaksSnapshot.forEach(doc => {
      const data = doc.data() as DocumentData;
      const lastDate = (data.lastCommentDate as Timestamp).toDate();
      if (isSameDay(today, lastDate) || isYesterday(lastDate)) {
        activeStreaks.push({
          userId: doc.id,
          currentStreak: data.currentStreak,
          lastCommentDate: data.lastCommentDate,
          isAnonymous: data.isAnonymous,
          username: data.username,
          gender: data.gender,
          countryCode: data.countryCode,
          attitude: data.attitude,
          emotion: data.emotion,
        });
      }
    });

    activeStreaks.sort((a, b) => b.currentStreak - a.currentStreak);
    const topStreaks = activeStreaks.slice(0, count);

    const nonAnonymousUserIds = topStreaks.filter(s => !s.isAnonymous).map(s => s.userId);
    let profiles = new Map<string, UserProfile>();

    if (nonAnonymousUserIds.length > 0) {
      const usersRef = collection(db, 'users');
      const batches = [];
      for (let i = 0; i < nonAnonymousUserIds.length; i += 30) {
        batches.push(nonAnonymousUserIds.slice(i, i + 30));
      }
      for (const batch of batches) {
        const usersQuery = query(usersRef, where('__name__', 'in', batch));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
          profiles.set(doc.id, { uid: doc.id, ...doc.data() } as UserProfile);
        });
      }
    }

    const streaksWithProfiles: StreakWithProfile[] = topStreaks.map(streak => {
      if (streak.isAnonymous) {
        return {
          ...streak,
          userProfile: {
            uid: streak.userId,
            username: streak.username || 'Invitado',
            gender: streak.gender,
            countryCode: streak.countryCode,
            isAnonymous: true,
            email: null,
            role: 'user',
            createdAt: new Date().toISOString(),
          }
        };
      } else {
        return {
          ...streak,
          userProfile: profiles.get(streak.userId) || null
        };
      }
    });

    return streaksWithProfiles;

  } catch (error: any) {
    console.error("Error fetching top streaks:", error);
    if (String(error.message).toLowerCase().includes('index')) {
        console.error("POSSIBLE FIX: This query likely requires a composite index in Firestore. Check the browser's developer console for a link to create it automatically.");
    }
    return [];
  }
}

export async function getStreaksForUser(userId: string): Promise<StreakWithProfile[]> {
    const figuresRef = collection(db, "figures");
    const userStreaks: StreakWithProfile[] = [];
    
    try {
        const figuresSnapshot = await getDocs(figuresRef);
        
        for (const figureDoc of figuresSnapshot.docs) {
            const streakDocRef = doc(db, `figures/${figureDoc.id}/streaks`, userId);
            const streakDoc = await getDoc(streakDocRef);
            
            if (streakDoc.exists()) {
                const data = streakDoc.data() as DocumentData;
                const lastDate = (data.lastCommentDate as Timestamp).toDate();
                if (isSameDay(new Date(), lastDate) || isYesterday(lastDate)) {
                     userStreaks.push({
                        figureId: figureDoc.id, // Add figureId to the streak object
                        userId: streakDoc.id,
                        currentStreak: data.currentStreak,
                        lastCommentDate: data.lastCommentDate,
                        isAnonymous: data.isAnonymous,
                        username: data.username,
                        gender: data.gender,
                        countryCode: data.countryCode,
                        attitude: data.attitude,
                        emotion: data.emotion,
                        userProfile: null // This is populated later if needed, not here
                    });
                }
            }
        }
        
        return userStreaks.sort((a, b) => b.currentStreak - a.currentStreak);

    } catch (error) {
        console.error("Error fetching streaks for user:", error);
        return [];
    }
}


// --- Ratings ---
export async function submitStarRating(
    figureId: string,
    userId: string,
    rating: RatingValue | null
): Promise<void> {
    const figureDocRef = doc(db, 'figures', figureId);
    const userRatingDocRef = doc(db, 'userRatings', `${userId}_${figureId}`);

    await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureDocRef);
        if (!figureDoc.exists()) {
            throw new Error("Figure document not found.");
        }
        const figureData = figureDoc.data();
        const newRatingCounts = { ...defaultRatingCounts, ...figureData.ratingCounts };
        
        const userRatingDoc = await transaction.get(userRatingDocRef);
        const previousRating = userRatingDoc.exists() ? userRatingDoc.data().rating as RatingValue : null;

        if (previousRating !== null) {
            newRatingCounts[previousRating] = Math.max(0, (newRatingCounts[previousRating] || 0) - 1);
        }
        if (rating !== null) {
            newRatingCounts[rating] = (newRatingCounts[rating] || 0) + 1;
        }

        transaction.update(figureDocRef, { ratingCounts: newRatingCounts });

        if (rating !== null) {
            transaction.set(userRatingDocRef, {
                userId,
                figureId,
                rating,
                addedAt: serverTimestamp()
            });
        } else if (userRatingDoc.exists()) {
            transaction.delete(userRatingDocRef);
        }
    });
}

// --- Specific Content Voting ---

const voteForContentEmotion = async (
  path: 'youtubeShorts' | 'instagramPosts',
  figureId: string,
  contentId: string,
  newEmotion: EmotionKey | null,
  userId: string,
  previousEmotion: EmotionKey | null
): Promise<void> => {
  const contentDocRef = doc(db, `figures/${figureId}/${path}`, contentId);

  await runTransaction(db, async (transaction) => {
    const contentDoc = await transaction.get(contentDocRef);
    if (!contentDoc.exists()) throw new Error("Contenido no encontrado.");

    const contentData = contentDoc.data() as YoutubeShort | InstagramPost;
    const currentCounts = contentData.perceptionCounts || {};
    const newCounts = { ...currentCounts };

    // Decrement the count for the previous emotion, if one existed
    if (previousEmotion) {
        newCounts[previousEmotion] = Math.max(0, (newCounts[previousEmotion] || 0) - 1);
    }
    // Increment the count for the new emotion, if one is selected
    if (newEmotion) {
        newCounts[newEmotion] = (newCounts[newEmotion] || 0) + 1;
    }
    
    transaction.update(contentDocRef, { perceptionCounts: newCounts });
  });

  const storageKey = `wikistars5-emotions-${userId}`;
  let storedVotes: { figureId: string; emotion: EmotionKey }[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Find if there's a vote for this specific item (short or post)
  // We'll use the figureId for simplicity, as we don't store individual item votes in profile activity
  const voteIndex = storedVotes.findIndex(v => v.figureId === figureId);

  if (newEmotion === null) { // Deselecting
    if (voteIndex > -1) {
      storedVotes.splice(voteIndex, 1);
    }
  } else { // Selecting or changing
    if (voteIndex > -1) {
      storedVotes[voteIndex].emotion = newEmotion;
    } else {
      storedVotes.push({ figureId: figureId, emotion: newEmotion });
    }
  }
  
  localStorage.setItem(storageKey, JSON.stringify(storedVotes));
};

export const voteForShortEmotion = (figureId: string, shortId: string, newEmotion: EmotionKey | null, userId: string, previousEmotion: EmotionKey | null) => 
  voteForContentEmotion('youtubeShorts', figureId, shortId, newEmotion, userId, previousEmotion);

export const voteForInstagramPostEmotion = (figureId: string, postId: string, newEmotion: EmotionKey | null, userId: string, previousEmotion: EmotionKey | null) =>
  voteForContentEmotion('instagramPosts', figureId, postId, newEmotion, userId, previousEmotion);



export const getReplies = async (repliesPath: string): Promise<Comment[]> => {
    const repliesRef = collection(db, repliesPath);
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToComment);
};

    