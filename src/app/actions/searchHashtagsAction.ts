
'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Hashtag, Figure } from '@/lib/types';
import { mapDocToFigure } from '@/lib/placeholder-data';


/**
 * Searches for hashtags that start with the given search term.
 * This search is case-insensitive.
 * @param searchTerm The term to search for.
 * @returns A promise that resolves to an array of matching hashtags.
 */
export async function searchHashtags(searchTerm: string): Promise<Hashtag[]> {
  const trimmedSearchTerm = searchTerm.trim().toLowerCase();
  if (trimmedSearchTerm.length < 2) {
    return [];
  }

  try {
    const hashtagsCollectionRef = collection(db, 'hashtags');
    
    // Firestore's "starts with" query pattern, case-insensitive.
    // We query against the document ID, which is the lowercase version of the hashtag.
    const q = query(
      hashtagsCollectionRef,
      where('__name__', '>=', trimmedSearchTerm),
      where('__name__', '<=', trimmedSearchTerm + '\uf8ff'),
      orderBy('__name__'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    // The document ID is the hashtag name (already lowercase).
    const hashtags: Hashtag[] = querySnapshot.docs.map(doc => ({ id: doc.id }));

    return hashtags;
  } catch (error) {
    console.error("Error searching hashtags in Firestore: ", error);
    if (String(error).includes('requires an index')) {
        throw new Error("La función de búsqueda necesita un índice que no existe. Por favor, crea el índice para la colección 'hashtags' desde la consola de Firebase.");
    }
    throw new Error("Failed to search hashtags due to a server error.");
  }
}

/**
 * Searches for figures that have a hashtag starting with the given search term.
 * This provides direct profile suggestions when typing a hashtag.
 * @param searchTerm The term to search for (without the #).
 * @returns A promise that resolves to an array of matching Figure objects.
 */
export async function searchFiguresByHashtag(searchTerm: string): Promise<Figure[]> {
  const trimmedSearchTerm = searchTerm.trim().toLowerCase();
  if (trimmedSearchTerm.length < 1) {
    return [];
  }

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    const q = query(
      figuresCollectionRef,
      where('hashtagKeywords', 'array-contains', trimmedSearchTerm),
      where('status', '==', 'approved'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    
    const figures = querySnapshot.docs.map(mapDocToFigure);
    figures.sort((a, b) => a.name.localeCompare(b.name));

    return figures;
  } catch (error) {
    console.error("Error searching figures by hashtag in Firestore: ", error);
    if (String(error).includes('requires an index')) {
        throw new Error("La función de búsqueda de figuras por hashtag necesita un índice de Firestore. Por favor, crea el índice compuesto para 'figures' en el campo 'hashtagKeywords' (array-contains) desde la consola de Firebase.");
    }
    throw new Error("Failed to search figures by hashtag due to a server error.");
  }
}
