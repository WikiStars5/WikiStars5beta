'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { mapDocToFigure } from '@/lib/placeholder-data';

export async function searchFiguresByName(searchTerm: string): Promise<Figure[]> {
  const trimmedSearchTerm = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (trimmedSearchTerm.length < 2) {
    return [];
  }

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    // Firestore "starts with" query. This is the correct way to implement autocomplete.
    // It finds all documents where nameSearch starts with the search term.
    const q = query(
      figuresCollectionRef,
      where('nameSearch', '>=', trimmedSearchTerm),
      where('nameSearch', '<=', trimmedSearchTerm + '\uf8ff'),
      orderBy('nameSearch'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const figures: Figure[] = querySnapshot.docs.map(mapDocToFigure);

    return figures;
  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    if (String(error).includes('requires an index')) {
         throw new Error("La función de búsqueda necesita un índice de Firestore que no existe. Por favor, crea el índice compuesto para la colección 'figures' en el campo 'nameSearch' (ascendente) desde la consola de Firebase.");
    }
    throw new Error("Failed to search figures due to a server error.");
  }
}
