'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { mapDocToFigure } from '@/lib/placeholder-data';

export async function searchFiguresByName(searchTerm: string): Promise<Figure[]> {
  const trimmedSearchTerm = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (trimmedSearchTerm.length < 1) { // Allow search from 1 character
    return [];
  }

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    // The single, powerful query for autocomplete on any part of the name
    const q = query(
      figuresCollectionRef,
      where('nameKeywords', 'array-contains', trimmedSearchTerm),
      where('status', '==', 'approved'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);

    const figures = querySnapshot.docs.map(mapDocToFigure);

    // Optional: sort the combined results alphabetically for consistent display
    figures.sort((a, b) => a.name.localeCompare(b.name));

    return figures;

  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    if (String(error).includes('requires an index')) {
         throw new Error("La función de búsqueda necesita un índice de Firestore que no existe. Por favor, crea el índice compuesto para la colección 'figures' en el campo 'nameKeywords' desde la consola de Firebase.");
    }
    throw new Error("Failed to search figures due to a server error.");
  }
}
