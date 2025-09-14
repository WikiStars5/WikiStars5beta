
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

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    // Firestore does not support native substring searches like 'startsWith' efficiently.
    // The standard workaround is to use a range query with >= and <=.
    // We query for all names that are >= search term and < search term + a high-Unicode character.
    // This effectively simulates a "starts with" query.
    const q = query(
      figuresCollectionRef,
      where('nameLower', '>=', trimmedSearchTerm),
      where('nameLower', '<=', trimmedSearchTerm + '\uf8ff'),
      orderBy('nameLower'), // We need to order by the field we are querying on.
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const figures: Figure[] = querySnapshot.docs.map(mapDocToFigure);

    return figures;
  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    // Provide a more specific error message if it's an index issue.
    if (String(error).includes('requires an index')) {
         throw new Error("La función de búsqueda necesita un índice de Firestore que no existe. Por favor, crea el índice compuesto para la colección 'figures' en el campo 'nameLower' desde la consola de Firebase.");
    }
    throw new Error("Failed to search figures due to a server error.");
  }
}
