
import type { Figure, PerceptionOption, EmotionKey, AttitudeKey, Comment, LocalUserStreak, Streak, StreakWithProfile, UserProfile } from './types';
import { Meh, Star, Heart, ThumbsDown } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, limit, type DocumentData, Timestamp, where, type DocumentSnapshot, type QueryDocumentSnapshot, startAfter as firestoreStartAfter, endBefore as firestoreEndBefore, runTransaction, addDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove } from "firebase/firestore";
import { differenceInHours } from 'date-fns';

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
    nationalityCode: data.nationalityCode || "",
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
    socialLinks: data.socialLinks || {},
    relatedFigureIds: data.relatedFigureIds || [],
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
          id, createdAt, nameLower: nameLowerInput, perceptionCounts, attitudeCounts,
          name, photoUrl, description, nationality, nationalityCode, occupation, gender, alias, species,
          firstAppearance, birthDateOrAge, birthPlace, statusLiveOrDead, maritalStatus,
          height, weight, hairColor, eyeColor, distinctiveFeatures, status, isFeatured,
          category, sportSubcategory, relatedFigureIds, socialLinks, ...rest
      } = figure;

      const updatePayload: { [key: string]: any } = {};

      if (name !== undefined) {
        updatePayload.name = name;
        updatePayload.nameLower = name.toLowerCase();
      }
      if (photoUrl !== undefined) updatePayload.photoUrl = photoUrl;
      if (description !== undefined) updatePayload.description = description;
      if (nationality !== undefined) updatePayload.nationality = nationality;
      if (nationalityCode !== undefined) updatePayload.nationalityCode = nationalityCode;
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
      if (isFeatured !== undefined) updatePayload.isFeatured = isFeatured;
      if (category !== undefined) updatePayload.category = category;
      if (sportSubcategory !== undefined) updatePayload.sportSubcategory = sportSubcategory;
      if (perceptionCounts) updatePayload.perceptionCounts = perceptionCounts;
      if (attitudeCounts) updatePayload.attitudeCounts = attitudeCounts;
      if (socialLinks) updatePayload.socialLinks = socialLinks;
      if (relatedFigureIds) updatePayload.relatedFigureIds = relatedFigureIds;
      
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


// --- Comments ---

export const mapDocToComment = (docSnap: DocumentSnapshot): Comment => {
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
    createdAt: data.createdAt,
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
  text: string
): Promise<string> {
    const commentsCollectionRef = collection(db, `figures/${figureId}/comments`);
    const commentData = {
        figureId: figureId,
        authorId: authorData.id,
        authorName: authorData.name,
        authorPhotoUrl: authorData.photoUrl,
        authorGender: authorData.gender,
        authorCountry: authorData.country,
        authorCountryCode: authorData.countryCode,
        text: text,
        createdAt: serverTimestamp(),
        likes: [],
        likeCount: 0,
        dislikes: [],
        dislikeCount: 0,
        replyCount: 0,
        isAnonymous: authorData.isAnonymous,
    };

    const docRef = await addDoc(commentsCollectionRef, commentData);
    return docRef.id;
}


export async function addReply(
  parentPath: string, // e.g., 'figures/some-id/comments/comment-id'
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
  text: string
): Promise<string> {
  const repliesCollectionRef = collection(db, `${parentPath}/replies`);
  const replyData = {
    figureId: figureId,
    authorId: authorData.id,
    authorName: authorData.name,
    authorPhotoUrl: authorData.photoUrl,
    authorGender: authorData.gender,
    authorCountry: authorData.country,
    authorCountryCode: authorData.countryCode,
    text: text,
    createdAt: serverTimestamp(),
    likes: [],
    likeCount: 0,
    dislikes: [],
    dislikeCount: 0,
    replyCount: 0,
    isAnonymous: authorData.isAnonymous,
  };

  const docRef = await addDoc(repliesCollectionRef, replyData);
  
  // Increment replyCount on the parent document
  const parentRef = doc(db, parentPath);
  await runTransaction(db, async (transaction) => {
    const parentDoc = await transaction.get(parentRef);
    if (!parentDoc.exists()) {
      throw new Error("Parent document does not exist.");
    }
    const newReplyCount = (parentDoc.data().replyCount || 0) + 1;
    transaction.update(parentRef, { replyCount: newReplyCount });
  });

  return docRef.id;
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
  const batch = writeBatch(db);

  // Recursively delete all nested replies
  await deleteRepliesRecursive(`${documentPath}/replies`, batch);
  
  // Delete the main comment
  batch.delete(commentRef);
  
  await batch.commit();

  // Update reply count on the parent if it's a reply
  const pathParts = documentPath.split('/');
  // A reply path will have an odd number of segments > 3, e.g. figures/id/comments/id/replies/id (6 segments for collection ref, 7 for doc)
  // The path to a document must have an even number of segments.
  // figures/{figureId}/comments/{commentId} -> 4 segments (parent is collection)
  // figures/{figureId}/comments/{commentId}/replies/{replyId} -> 6 segments (parent is document)
  if (pathParts.length > 4 && pathParts[pathParts.length - 2] === 'replies') { 
    const parentRef = doc(db, pathParts.slice(0, -2).join('/'));
    await runTransaction(db, async (transaction) => {
      const parentDoc = await transaction.get(parentRef);
      if (parentDoc.exists()) {
          const newReplyCount = Math.max(0, (parentDoc.data().replyCount || 0) - 1);
          transaction.update(parentRef, { replyCount: newReplyCount });
      }
    });
  }
}

// --- Streaks ---

export async function updateStreak(
  figureId: string,
  userId: string,
  isAnonymous: boolean
): Promise<number | null> {
  const streakRef = doc(db, `figures/${figureId}/streaks`, userId);
  let newStreakCount: number | null = null;
  const now = new Date();

  try {
    await runTransaction(db, async (transaction) => {
      const streakDoc = await transaction.get(streakRef);

      if (!streakDoc.exists()) {
        const newStreakData = {
          userId,
          currentStreak: 1,
          lastCommentDate: now,
          isAnonymous,
        };
        transaction.set(streakRef, newStreakData);
        newStreakCount = 1;
      } else {
        const streakData = streakDoc.data();
        const lastCommentDate = (streakData.lastCommentDate as Timestamp).toDate();
        const hoursSinceLastComment = differenceInHours(now, lastCommentDate);

        if (hoursSinceLastComment < 24) {
          newStreakCount = streakData.currentStreak;
          transaction.update(streakRef, { lastCommentDate: now });
        } else if (hoursSinceLastComment >= 24 && hoursSinceLastComment < 48) {
          newStreakCount = (streakData.currentStreak || 0) + 1;
          transaction.update(streakRef, {
            currentStreak: newStreakCount,
            lastCommentDate: now,
          });
        } else {
          newStreakCount = 1;
          transaction.update(streakRef, {
            currentStreak: 1,
            lastCommentDate: now,
          });
        }
      }
    });
  } catch (error) {
    console.error("Firestore streak update transaction failed: ", error);
    return null; 
  }

  if (typeof window !== 'undefined' && newStreakCount !== null) {
      try {
          const storageKey = 'wikistars5-userStreaks';
          let localStreaks: LocalUserStreak[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          const existingStreakIndex = localStreaks.findIndex(s => s.figureId === figureId);
          
          if (existingStreakIndex !== -1) {
              localStreaks[existingStreakIndex].currentStreak = newStreakCount;
              localStreaks[existingStreakIndex].lastCommentDate = now.toISOString();
          } else {
              localStreaks.push({
                  figureId,
                  figureName: '', // This will be incomplete, but sufficient for streak logic
                  figurePhotoUrl: '',
                  currentStreak: newStreakCount,
                  lastCommentDate: now.toISOString(),
              });
          }
          
          localStorage.setItem(storageKey, JSON.stringify(localStreaks));
      } catch (e) {
          console.error("Failed to update streaks in localStorage", e);
      }
  }

  return newStreakCount;
}

export async function getTopStreaksForFigure(figureId: string, count: number = 10): Promise<StreakWithProfile[]> {
  const streaksRef = collection(db, `figures/${figureId}/streaks`);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Step 1: Query for active streaks.
  const q = query(
    streaksRef,
    where('lastCommentDate', '>', twentyFourHoursAgo)
  );

  try {
    const querySnapshot = await getDocs(q);
    let streaks: Streak[] = [];
    const userIds: string[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const streak: Streak = {
        userId: doc.id,
        currentStreak: data.currentStreak,
        lastCommentDate: data.lastCommentDate,
        isAnonymous: data.isAnonymous,
      };
      streaks.push(streak);
      if (!data.isAnonymous) {
        userIds.push(doc.id);
      }
    });

    // Step 2: Sort the results in the client.
    streaks.sort((a, b) => b.currentStreak - a.currentStreak);
    
    // Limit to the desired count after sorting.
    streaks = streaks.slice(0, count);

    if (streaks.length === 0) {
      return [];
    }

    // Step 3: Fetch user profiles for the top streaks.
    let profiles = new Map<string, UserProfile>();
    const topUserIds = streaks
      .filter(s => !s.isAnonymous)
      .map(s => s.userId);

    if (topUserIds.length > 0) {
      const usersRef = collection(db, 'users');
      // Firestore 'in' queries are limited to 30 items. Batch if necessary.
      const batches = [];
      for (let i = 0; i < topUserIds.length; i += 30) {
        batches.push(topUserIds.slice(i, i + 30));
      }
      for (const batch of batches) {
        const usersQuery = query(usersRef, where('__name__', 'in', batch));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
          profiles.set(doc.id, { uid: doc.id, ...doc.data() } as UserProfile);
        });
      }
    }
    
    // Step 4: Combine streaks with profile information.
    const streaksWithProfiles = streaks.map(streak => ({
      ...streak,
      userProfile: streak.isAnonymous ? null : profiles.get(streak.userId) || null
    }));

    return streaksWithProfiles;

  } catch (error: any) {
    console.error("Error fetching top streaks:", error);
    if(String(error.message).toLowerCase().includes('index')) {
        console.error("POSSIBLE FIX: This query likely requires a composite index in Firestore. Check the browser's developer console for a link to create it automatically.");
    }
    return [];
  }
}

    
