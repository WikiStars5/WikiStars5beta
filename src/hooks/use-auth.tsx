
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  linkWithCredential,
  type User as FirebaseUser,
  type AuthCredential
} from 'firebase/auth';
import type { UserProfile, LocalProfile, Comment, Notification } from '@/lib/types';
import { doc, onSnapshot, getDoc, collectionGroup, query, where, Timestamp, onSnapshot as onCollectionSnapshot, orderBy, limit } from 'firebase/firestore';
import { ADMIN_UID } from '@/config/admin';
import { useRouter } from 'next/navigation';
import { useLocalProfile } from './use-local-profile';
import { useToast } from './use-toast';
import Link from 'next/link';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  localProfile: LocalProfile | null;
  setLocalProfile: (profile: LocalProfile | null) => void;
  isAdmin: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, countryCode: string, gender: string) => Promise<void>;
  linkAccount: (credential: AuthCredential, newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const { localProfile: initialLocalProfile, saveLocalProfile, clearLocalProfile } = useLocalProfile(firebaseUser?.uid);
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(initialLocalProfile);

  useEffect(() => {
    setLocalProfile(initialLocalProfile);
  }, [initialLocalProfile]);
  
  // Global listener for new replies
  useEffect(() => {
    if (!firebaseUser || isLoading) return;
    
    const repliesQuery = query(
        collectionGroup(db, 'replies')
    );

    const unsubscribe = onCollectionSnapshot(repliesQuery, async (snapshot) => {
      const newReplies = snapshot.docChanges().filter(change => change.type === 'added');

      for (const docChange of newReplies) {
        const reply = docChange.doc.data() as Comment;
        
        const replyTime = (reply.createdAt as Timestamp)?.toDate();
        if (!replyTime || (new Date().getTime() - replyTime.getTime()) > 60000) { 
            continue;
        }

        if (reply.authorId === firebaseUser.uid) {
            continue;
        }

        const parentCommentRef = docChange.doc.ref.parent.parent;
        if (parentCommentRef) {
            const parentCommentSnap = await getDoc(parentCommentRef);
            if (parentCommentSnap.exists()) {
                const parentComment = parentCommentSnap.data() as Comment;
                if (parentComment.authorId === firebaseUser.uid) {
                    const figureDoc = await getDoc(parentCommentRef.parent.parent);
                    const figureName = figureDoc.exists() ? figureDoc.data().name : 'un perfil';
                    
                    const audio = new Audio('https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Flivechat.mp3?alt=media&token=e24b4376-3067-4953-91cc-7076d9df9711');
                    audio.play().catch(e => console.error("Error playing notification sound:", e));

                    toast({
                      title: `💬 Nueva respuesta en ${figureName}`,
                      description: `${reply.authorName} respondió a tu comentario.`,
                      action: (
                        <Link href={`/figures/${reply.figureId}?comment=${parentCommentRef.id}#comment-${docChange.doc.id}`}>
                          Ver
                        </Link>
                      ),
                    });
                    
                    // --- Local Notification Logic ---
                    const storageKey = `wikistars5-notifications-${firebaseUser.uid}`;
                    const newNotification: Notification = {
                      id: docChange.doc.id,
                      type: 'reply',
                      figureId: reply.figureId,
                      figureName: figureName,
                      commentId: parentCommentRef.id,
                      replyId: docChange.doc.id, // Store the ID of the reply itself
                      replierName: reply.authorName,
                      text: reply.text,
                      isRead: false,
                      createdAt: new Date().toISOString(),
                    };
                    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    localStorage.setItem(storageKey, JSON.stringify([newNotification, ...existing]));
                    // Dispatch custom event so the bell component can update
                    window.dispatchEvent(new CustomEvent('notifications-updated'));
                }
            }
        }
      }
    });

    return () => unsubscribe();
  }, [firebaseUser, toast, isLoading]);

  const handleUser = useCallback(async (user: FirebaseUser | null) => {
    setIsLoading(true);
    if (user) {
      setFirebaseUser(user);
    } else {
      try {
        const userCredential = await signInAnonymously(auth);
        setFirebaseUser(userCredential.user);
      } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        setFirebaseUser(null);
        setCurrentUser(null);
        setIsLoading(false);
      }
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  useEffect(() => {
      if (!firebaseUser) {
        setIsLoading(false);
        return;
      }
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as UserProfile);
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setCurrentUser(null);
        setIsLoading(false);
      });

      return () => unsubscribeProfile();
  }, [firebaseUser]);

  const isAdmin = currentUser?.role === 'admin' && currentUser?.uid === ADMIN_UID;
  const isAnonymous = firebaseUser ? firebaseUser.isAnonymous : true;

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };
  
  const linkAccount = async (credential: AuthCredential, newUsername: string) => {
    if (!auth.currentUser) throw new Error("No user to link.");
    
    await linkWithCredential(auth.currentUser, credential);
    await updateProfile(auth.currentUser, { displayName: newUsername });

    if (localProfile) {
        await updateUserProfile(newUsername, localProfile.countryCode, localProfile.gender);
        clearLocalProfile();
    }
  };

  const updateUserProfile = async (username: string, countryCode: string, gender: string) => {
    if (isAnonymous && firebaseUser) {
        const profile = { username, countryCode, gender };
        saveLocalProfile(profile);
        setLocalProfile(profile);
        return;
    }

    if (!auth.currentUser) {
      throw new Error("No authenticated user found.");
    }
    
    // For registered users, we update their profile in Firestore.
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, {
      username: username,
      countryCode: countryCode,
      gender: gender,
    }, { merge: true });
    
    await updateProfile(auth.currentUser, { displayName: username });
  };

  const value = {
    firebaseUser,
    currentUser,
    localProfile,
    setLocalProfile,
    isAdmin,
    isLoading,
    isAnonymous,
    signIn,
    logout,
    updateUserProfile,
    linkAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
