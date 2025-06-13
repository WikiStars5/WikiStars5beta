'use server';

import { db } from '@/lib/firebase';
import type { Comment, UserRating, UserProfile } from '@/lib/types';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

// Add a new comment to Firestore
export async function addComment(
  figureId: string,
  figureName: string, // Denormalized
  userId: string,
  userName: string, // Denormalized
  userAvatarUrl: string | undefined, // Denormalized
  commentText: string,
  parentCommentId: string | null
): Promise<{ success: boolean; commentId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId || !commentText.trim()) {
    return { success: false, message: 'Figure ID and comment text are required.' };
  }

  try {
    const commentData: Omit<Comment, 'id' | 'replies' | 'userStarRatingForFigure' | 'timestamp'> & { timestamp: any } = {
      figureId,
      figureName, // Denormalized
      userId,
      userName, // Denormalized
      userAvatarUrl: userAvatarUrl || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`, // Denormalized
      commentText: commentText.trim(),
      parentCommentId,
      likesCount: 0,
      dislikesCount: 0,
      status: 'pending', // Default status for moderation
      timestamp: serverTimestamp(), // Firestore server-side timestamp
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    return { success: true, commentId: docRef.id, message: 'Comment submitted for moderation.' };
  } catch (error) {
    console.error('Error adding comment to Firestore:', error);
    return { success: false, message: 'Failed to add comment.' };
  }
}

// Get approved comments for a figure, with their replies and author's star rating for the figure
export async function getFigureCommentsWithRatings(figureId: string): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('figureId', '==', figureId),
      where('status', '==', 'approved'),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(commentsQuery);
    
    const commentsData: Comment[] = [];
    const userIdsForRatingFetch = new Set<string>();

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      commentsData.push({ 
        id: docSnap.id, 
        ...data,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(), // Convert Firestore Timestamp
      } as Comment);
      userIdsForRatingFetch.add(data.userId);
    });

    // Fetch user ratings for all unique users who commented on this figure
    const userRatingsMap = new Map<string, number>(); // Map<userId, stars>
    if (userIdsForRatingFetch.size > 0) {
      const ratingsQuery = query(
        collection(db, 'userRatings'),
        where('figureId', '==', figureId),
        where('userId', 'in', Array.from(userIdsForRatingFetch))
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      ratingsSnapshot.forEach(docSnap => {
        const rating = docSnap.data() as UserRating;
        userRatingsMap.set(rating.userId, rating.stars);
      });
    }

    // Add userStarRatingForFigure to comments and structure replies
    const commentsWithDetails = commentsData.map(comment => ({
      ...comment,
      userStarRatingForFigure: userRatingsMap.get(comment.userId),
    }));

    // Simple one-level reply structuring
    const topLevelComments = commentsWithDetails.filter(comment => !comment.parentCommentId);
    const repliesMap = new Map<string, Comment[]>();
    commentsWithDetails.filter(comment => comment.parentCommentId).forEach(reply => {
      const parentList = repliesMap.get(reply.parentCommentId!) || [];
      parentList.push(reply);
      repliesMap.set(reply.parentCommentId!, parentList.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    });

    return topLevelComments.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || [],
    }));

  } catch (error) {
    console.error('Error fetching comments with ratings:', error);
    return [];
  }
}

// Update like/dislike count for a comment
export async function updateCommentReaction(
  commentId: string,
  reactionType: 'like' | 'dislike',
  currentLiked: boolean, // if user currently likes it
  currentDisliked: boolean // if user currently dislikes it
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  
  const commentRef = doc(db, 'comments', commentId);

  try {
    let newLikesCount = increment(0);
    let newDislikesCount = increment(0);

    if (reactionType === 'like') {
      if (currentLiked) { // User is unliking
        newLikesCount = increment(-1);
      } else { // User is liking
        newLikesCount = increment(1);
        if (currentDisliked) { // Was disliked, now liking, so remove dislike
          newDislikesCount = increment(-1);
        }
      }
    } else { // reactionType === 'dislike'
      if (currentDisliked) { // User is undisliking
        newDislikesCount = increment(-1);
      } else { // User is disliking
        newDislikesCount = increment(1);
        if (currentLiked) { // Was liked, now disliking, so remove like
          newLikesCount = increment(-1);
        }
      }
    }
    
    await updateDoc(commentRef, {
      likesCount: newLikesCount,
      dislikesCount: newDislikesCount,
    });
    return { success: true, message: 'Reaction updated.' };
  } catch (error) {
    console.error('Error updating comment reaction:', error);
    return { success: false, message: 'Failed to update reaction.' };
  }
}

// Get all comments for moderation (admin)
export async function getAllCommentsForModeration(): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('status', 'asc'), // 'pending' first, then 'approved', then 'rejected'
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(commentsQuery);
    const comments: Comment[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      comments.push({ 
        id: docSnap.id,
         ...data,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      } as Comment);
    });
    return comments;
  } catch (error) {
    console.error('Error fetching all comments for moderation:', error);
    return [];
  }
}

// Moderate a comment (approve or reject)
export async function moderateComment(
  commentId: string,
  newStatus: 'approved' | 'rejected'
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  const commentRef = doc(db, 'comments', commentId);
  try {
    await updateDoc(commentRef, { status: newStatus });
    return { success: true, message: `Comment status updated to ${newStatus}.` };
  } catch (error) {
    console.error('Error moderating comment:', error);
    return { success: false, message: 'Failed to moderate comment.' };
  }
}


// Get count of pending comments
export async function getPendingCommentsCount(): Promise<number> {
  try {
    const q = query(collection(db, 'comments'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching pending comments count:', error);
    return 0; // Return 0 on error
  }
}
