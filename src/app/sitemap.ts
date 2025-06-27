import { MetadataRoute } from 'next';
import { getAllFiguresFromFirestore } from '@/lib/placeholder-data';
import type { Figure } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // IMPORTANT: You must set this in your .env.local file
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
      url: `${baseUrl}/home`,
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
     {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...figureUrls];
}
