
import { MetadataRoute } from 'next';
import { getAllFiguresFromFirestore } from '@/lib/placeholder-data';
import type { Figure } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use the production URL directly to ensure correctness.
  const baseUrl = 'https://wikistars5.co';

  // Get all figures to create dynamic routes
  const figures: Figure[] = await getAllFiguresFromFirestore();

  const figureUrls = figures.map((figure) => ({
    url: `${baseUrl}/figures/${figure.id}`,
    lastModified: figure.createdAt ? new Date(figure.createdAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Add static routes
  const staticUrls = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/figures`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    // The login and signup pages have been removed, so they are also removed from the sitemap.
  ];

  return [...staticUrls, ...figureUrls];
}
