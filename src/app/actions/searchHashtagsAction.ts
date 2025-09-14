
'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Hashtag } from '@/lib/types';

/**
 * Searches for hashtags that start with the given search term.
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
    
    // Use Firestore's "starts with" query pattern.
    const q = query(
      hashtagsCollectionRef,
      where('__name__', '>=', trimmedSearchTerm),
      where('__name__', '<=', trimmedSearchTerm + '\uf8ff'),
      orderBy('__name__'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
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
