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
    
    // Query 1: Prefix search on the full name (nameSearch field)
    const prefixQuery = query(
      figuresCollectionRef,
      where('nameSearch', '>=', trimmedSearchTerm),
      where('nameSearch', '<=', trimmedSearchTerm + '\uf8ff'),
      orderBy('nameSearch'),
      limit(5)
    );

    // Query 2: Search for the term as a keyword in the nameKeywords array
    // This allows finding "Messi" in "Lionel Messi"
    const keywordQuery = query(
      figuresCollectionRef,
      where('nameKeywords', 'array-contains', trimmedSearchTerm),
      limit(5)
    );

    const [prefixSnapshot, keywordSnapshot] = await Promise.all([
      getDocs(prefixQuery),
      getDocs(keywordQuery)
    ]);

    const figuresMap = new Map<string, Figure>();

    prefixSnapshot.docs.forEach(doc => {
      if (!figuresMap.has(doc.id)) {
        figuresMap.set(doc.id, mapDocToFigure(doc));
      }
    });

    keywordSnapshot.docs.forEach(doc => {
      if (!figuresMap.has(doc.id)) {
        figuresMap.set(doc.id, mapDocToFigure(doc));
      }
    });
    
    const combinedFigures = Array.from(figuresMap.values());

    // Optional: sort the combined results alphabetically
    combinedFigures.sort((a, b) => a.name.localeCompare(b.name));

    return combinedFigures;

  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    if (String(error).includes('requires an index')) {
         throw new Error("La función de búsqueda necesita un índice de Firestore que no existe. Por favor, crea el índice compuesto para la colección 'figures' en el campo 'nameSearch' (ascendente) y/o 'nameKeywords' desde la consola de Firebase.");
    }
    throw new Error("Failed to search figures due to a server error.");
  }
}
