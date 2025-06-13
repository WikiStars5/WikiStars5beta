import type { Figure, Comment, UserRating, PerceptionOption, PerceptionKeys } from './types';
import { Meh, Star, Heart, ThumbsDown, ThumbsUp } from 'lucide-react';

export const PERCEPTION_OPTIONS: PerceptionOption[] = [
  { key: 'neutral', label: 'Neutral', icon: Meh },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];

export let FIGURES_DATA: Figure[] = [
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    photoUrl: 'https://placehold.co/300x400.png',
    dataAiHint: 'technology entrepreneur',
    description: 'Entrepreneur and Business Magnate',
    averageRating: 4.2,
    totalRatings: 1250,
    perceptionCounts: { neutral: 300, fan: 500, simp: 200, hater: 250 },
  },
  {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    photoUrl: 'https://placehold.co/300x400.png',
    dataAiHint: 'female singer',
    description: 'Singer-Songwriter',
    averageRating: 4.8,
    totalRatings: 2500,
    perceptionCounts: { neutral: 200, fan: 1500, simp: 600, hater: 200 },
  },
  {
    id: 'cristiano-ronaldo',
    name: 'Cristiano Ronaldo',
    photoUrl: 'https://placehold.co/300x400.png',
    dataAiHint: 'soccer player',
    description: 'Professional Footballer',
    averageRating: 4.5,
    totalRatings: 1800,
    perceptionCounts: { neutral: 400, fan: 900, simp: 300, hater: 200 },
  },
];

export const USER_RATINGS_DATA: UserRating[] = [
  { userId: 'user123', figureId: 'elon-musk', perception: 'fan', stars: 5, timestamp: new Date().toISOString() },
  { userId: 'user456', figureId: 'elon-musk', perception: 'hater', stars: 1, timestamp: new Date().toISOString() },
  { userId: 'user123', figureId: 'taylor-swift', perception: 'simp', stars: 5, timestamp: new Date().toISOString() },
];

export let COMMENTS_DATA: Comment[] = [
  {
    id: 'comment1',
    figureId: 'elon-musk',
    userId: 'user123',
    userDisplayName: 'TechBro',
    userAvatarUrl: 'https://placehold.co/40x40.png?text=TB',
    userStarRating: 5,
    text: 'Elon is a visionary! To the moon!',
    parentId: null,
    likes: 15,
    dislikes: 2,
    likedBy: [],
    dislikedBy: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  },
  {
    id: 'comment2',
    figureId: 'elon-musk',
    userId: 'user456',
    userDisplayName: 'SustainableSue',
    userAvatarUrl: 'https://placehold.co/40x40.png?text=SS',
    userStarRating: 1,
    text: 'I have some concerns about his environmental impact.',
    parentId: null,
    likes: 8,
    dislikes: 1,
    likedBy: [],
    dislikedBy: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
  },
  {
    id: 'comment3',
    figureId: 'elon-musk',
    userId: 'user789',
    userDisplayName: 'NeutralNed',
    userAvatarUrl: 'https://placehold.co/40x40.png?text=NN',
    // No star rating given by this user or commented before rating
    text: 'Interesting character, for sure. Lots of ups and downs.',
    parentId: null,
    likes: 5,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'reply1-to-comment1',
    figureId: 'elon-musk',
    userId: 'user456',
    userDisplayName: 'SustainableSue',
    userAvatarUrl: 'https://placehold.co/40x40.png?text=SS',
    userStarRating: 1,
    text: 'Visionary perhaps, but at what cost?',
    parentId: 'comment1',
    likes: 3,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
  },
  {
    id: 'comment-ts-1',
    figureId: 'taylor-swift',
    userId: 'user123',
    userDisplayName: 'SwiftieForever',
    userAvatarUrl: 'https://placehold.co/40x40.png?text=SF',
    userStarRating: 5,
    text: 'Taylor is queen! Eras tour was amazing!',
    parentId: null,
    likes: 22,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 mins ago
  },
];

// Helper to get comments for a figure, including replies
export const getCommentsForFigure = (figureId: string): Comment[] => {
  const allComments = COMMENTS_DATA.filter(comment => comment.figureId === figureId);
  const topLevelComments = allComments.filter(comment => !comment.parentId);
  
  return topLevelComments.map(comment => ({
    ...comment,
    replies: allComments.filter(reply => reply.parentId === comment.id)
                        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getFigureById = (id: string): Figure | undefined => {
  return FIGURES_DATA.find(figure => figure.id === id);
};

export const getUserRatingForFigure = (userId: string, figureId: string): UserRating | undefined => {
  return USER_RATINGS_DATA.find(rating => rating.userId === userId && rating.figureId === figureId);
};

// Functions to simulate data manipulation (in a real app, these would be API calls)
export const addFigure = (figure: Figure): void => {
  FIGURES_DATA.push(figure);
};

export const updateFigure = (updatedFigure: Figure): void => {
  const index = FIGURES_DATA.findIndex(f => f.id === updatedFigure.id);
  if (index !== -1) {
    FIGURES_DATA[index] = updatedFigure;
  }
};

export const deleteFigure = (figureId: string): void => {
  FIGURES_DATA = FIGURES_DATA.filter(f => f.id !== figureId);
};
