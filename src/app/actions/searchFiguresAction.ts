
'use server';

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';

export async function searchFiguresByName(searchTerm: string): Promise<Figure[]> {
  const trimmedSearchTerm = searchTerm.trim();
  if (!trimmedSearchTerm) {
    return [];
  }
  if (trimmedSearchTerm.length < 2) {
    return [];
  }
  
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();

  try {
    const figuresCollectionRef = collection(db, 'figures');
    
    // Query against the 'nameLower' field for case-insensitive search
    const q = query(
      figuresCollectionRef,
      orderBy('nameLower'), 
      where('nameLower', '>=', normalizedSearchTerm),
      where('nameLower', '<=', normalizedSearchTerm + '\uf8ff'),
      limit(10) 
    );

    const querySnapshot = await getDocs(q);
    const figures: Figure[] = [];
    querySnapshot.forEach((doc) => {
      figures.push({ id: doc.id, ...doc.data() } as Figure);
    });
    
    return figures;
  } catch (error) {
    console.error("Error searching figures in Firestore: ", error);
    throw new Error("Failed to search figures due to a server error.");
  }
}
