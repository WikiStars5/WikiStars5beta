
'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';

export async function searchFiguresByName(searchTerm: string): Promise<Figure[]> {
  const trimmedSearchTerm = searchTerm.trim();
  if (!trimmedSearchTerm) {
    return [];
  }
  if (trimmedSearchTerm.length < 2) { // Optional: enforce minimum length on server too
    return [];
  }
  
  // Firestore string queries are case-sensitive.
  // For a basic 'starts-with' search that's case-sensitive:
  const normalizedSearchTerm = trimmedSearchTerm;
  // If you store a lowercase version of the name (e.g., 'name_lowercase') in Firestore
  // you could do: const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();
  // and query against 'name_lowercase'. This is recommended for true case-insensitivity.

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    // The \uf8ff character is a high-point Unicode character that acts as an "upper bound"
    // for strings starting with searchTerm. This helps mimic a "starts with" query.
    const q = query(
      figuresCollectionRef,
      orderBy('name'), // Order by the field you are querying
      where('name', '>=', normalizedSearchTerm),
      where('name', '<=', normalizedSearchTerm + '\uf8ff'),
      limit(10) // Limit the number of results for performance
    );

    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((doc) => {
      figures.push({ id: doc.id, ...doc.data() } as Figure);
    });
    
    return figures;
  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    // Depending on your error handling strategy, you might rethrow,
    // return an empty array, or throw a custom error.
    // For now, rethrowing to let the client component handle it.
    throw new Error("Failed to search figures due to a server error.");
  }
}
