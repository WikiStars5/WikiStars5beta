
'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { mapDocToFigure } from '@/lib/placeholder-data';

export async function searchFiguresByName(searchTerm: string): Promise<Figure[]> {
  const trimmedSearchTerm = searchTerm.trim().toLowerCase();
  if (trimmedSearchTerm.length < 2) {
    return [];
  }

  // Split the search term into individual keywords
  const searchKeywords = trimmedSearchTerm.split(/\s+/).filter(Boolean);

  if (searchKeywords.length === 0) {
    return [];
  }

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    // Use 'array-contains-any' to find documents where the searchKeywords array
    // contains any of the keywords from the user's input.
    const q = query(
      figuresCollectionRef,
      where('searchKeywords', 'array-contains-any', searchKeywords),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const figures: Figure[] = querySnapshot.docs.map(mapDocToFigure);
    
    // Optional: Sort results client-side for relevance if needed, as Firestore doesn't guarantee order with 'in' or 'array-contains-any'.
    // For now, we return them as is, which is usually sufficient for a dropdown.

    return figures;
  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    // Provide a more specific error message if it's an index issue.
    if (String(error).includes('requires an index')) {
         throw new Error("La función de búsqueda necesita un índice de Firestore que no existe. Por favor, crea el índice compuesto para la colección 'figures' en el campo 'searchKeywords' desde la consola de Firebase.");
    }
    throw new Error("Failed to search figures due to a server error.");
  }
}
