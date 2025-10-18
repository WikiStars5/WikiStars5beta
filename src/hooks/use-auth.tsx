

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
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { UserProfile, LocalProfile, Comment, Notification } from '@/lib/types';
import { doc, onSnapshot, getDoc, setDoc, collectionGroup, query, Timestamp, onSnapshot as onCollectionSnapshot, updateDoc } from 'firebase/firestore';
import { ADMIN_UID } from '@/config/admin';
import { useRouter } from 'next/navigation';
import { useLocalProfile } from './use-local-profile';
import { useToast } from './use-toast';
import { useCommentThread } from './use-comment-thread';
import { findRootCommentRef } from '@/lib/utils';
import { callFirebaseFunction } from '@/lib/placeholder-data';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}


interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  localProfile: LocalProfile | null;
  setLocalProfile: (profile: LocalProfile | null) => void;
  isAdmin: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
  isNotificationsEnabled: boolean;
  requestNotificationPermission: () => void;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, countryCode: string, gender: string) => Promise<void>;
  linkAccount: (credential: AuthCredential, newUsername: string) => Promise<void>;
  canInstall: boolean;
  triggerInstallPrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { openCommentThread } = useCommentThread();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  const { localProfile: initialLocalProfile, saveLocalProfile, clearLocalProfile } = useLocalProfile(firebaseUser?.uid);
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(initialLocalProfile);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  // This effect listens for a custom event to know when to re-fetch the local profile from localStorage.
  useEffect(() => {
    const handleProfileUpdate = () => {
      const key = firebaseUser ? `wikistars5-local-profile-${firebaseUser.uid}` : '';
      if (key) {
        const item = window.localStorage.getItem(key);
        setLocalProfile(item ? JSON.parse(item) : null);
      }
    };
    window.addEventListener('local-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('local-profile-updated', handleProfileUpdate);
  }, [firebaseUser]);


  useEffect(() => {
    setLocalProfile(initialLocalProfile);
  }, [initialLocalProfile]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerInstallPrompt = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "¡Aplicación instalada!", description: "Disfruta de la mejor experiencia." });
      }
      setDeferredPrompt(null);
    } else {
        toast({ title: "Ya instalado o no soportado", description: "La aplicación ya podría estar instalada o tu navegador no es compatible." });
    }
  };

  const saveFcmToken = useCallback(async (user: FirebaseUser, token: string) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { fcmToken: token });
    }
  }, []);

  const deleteFcmToken = useCallback(async (user: FirebaseUser) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { fcmToken: null });
    }
  }, []);
  
  const isAnonymous = firebaseUser ? firebaseUser.isAnonymous : true;

  const requestNotificationPermission = useCallback(async () => {
    if (!firebaseUser || isAnonymous || typeof window === 'undefined' || !('Notification' in window)) return;
  
    const messaging = getMessaging();
    
    if (Notification.permission === 'granted') {
       // User wants to disable notifications
      await deleteFcmToken(firebaseUser);
      setIsNotificationsEnabled(false);
      toast({ title: 'Notificaciones Desactivadas' });
    } else {
      // User wants to enable notifications
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const vapidKey = 'BFf_ZMM9hrc2XfIfkZg0rGofHZTlH_P2a-Ydi5H_qfXm40q4iV3mFh3h7M9bXo-Y1s-Y3pEIXzVd8T6VpAAn5Wc';
          const fcmToken = await getToken(messaging, { vapidKey });
          if (fcmToken) {
            await saveFcmToken(firebaseUser, fcmToken);
            setIsNotificationsEnabled(true);
            toast({ title: '¡Notificaciones Activadas!', description: 'Recibirás alertas importantes.' });
          }
        } else {
          toast({ title: 'Permiso denegado', description: 'No se pudieron activar las notificaciones.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error getting notification permission:', error);
        toast({ title: 'Error', description: 'No se pudo completar la solicitud.', variant: 'destructive' });
      }
    }
  }, [firebaseUser, isAnonymous, saveFcmToken, deleteFcmToken, toast]);


  useEffect(() => {
    if (firebaseUser && currentUser?.fcmToken) {
        setIsNotificationsEnabled(true);
    } else {
        setIsNotificationsEnabled(false);
    }
}, [firebaseUser, currentUser]);

  
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
        if (!parentCommentRef) continue;

        const parentCommentSnap = await getDoc(parentCommentRef);
        if (parentCommentSnap.exists() && parentCommentSnap.data().authorId === firebaseUser.uid) {
            
            const rootCommentRef = findRootCommentRef(docChange.doc.ref);
            if (!rootCommentRef) continue;
            
            const figureDocRef = rootCommentRef.parent.parent;
            if (!figureDocRef) continue;

            const figureDoc = await getDoc(figureDocRef);
            const figureName = figureDoc.exists() ? figureDoc.data().name : 'un perfil';
            
            const audio = new Audio('https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Flivechat.mp3?alt=media&token=e24b4376-3067-4953-91cc-7076d9df9711');
            audio.play().catch(error => {
                if (error.name !== 'NotAllowedError') {
                    console.error("Error playing notification sound:", error);
                }
            });

            toast({
              title: `💬 Nueva respuesta en ${figureName}`,
              description: `${reply.authorName} respondió a tu comentario.`,
              action: (
                <button
                  onClick={() => openCommentThread(rootCommentRef.path, docChange.doc.id)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Ver
                </button>
              ),
            });
            
            const storageKey = `wikistars5-notifications-${firebaseUser.uid}`;
            const uniqueId = `${docChange.doc.id}-${new Date().getTime()}`;
            const newNotification: Notification = {
              id: uniqueId,
              type: 'reply',
              figureId: reply.figureId,
              figureName: figureName,
              commentId: rootCommentRef.id,
              replyId: docChange.doc.id,
              replierName: reply.authorName,
              text: reply.text,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([newNotification, ...existing]));
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        }
      }
    });

    return () => unsubscribe();
  }, [firebaseUser, toast, isLoading, openCommentThread]);

  const handleUser = useCallback(async (user: FirebaseUser | null) => {
    if (user) {
      setFirebaseUser(user);
      setIsLoading(false);
    } else {
      // If no user is found, actively try to sign in anonymously.
      // This is a robust way to handle cases where persistence fails in production.
      try {
        const userCredential = await signInAnonymously(auth);
        setFirebaseUser(userCredential.user);
      } catch (error: any) {
        console.error('CRITICAL: Anonymous sign-in failed:', error);
        // If even anonymous sign-in fails, there's a fundamental issue.
        toast({ 
          title: 'Error de Conexión', 
          description: 'No se pudo establecer una sesión. Por favor, revisa tu conexión y recarga la página.', 
          variant: 'destructive',
          duration: Infinity
        });
        setFirebaseUser(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [toast]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  useEffect(() => {
      if (!firebaseUser) {
        // isLoading is handled by handleUser now
        return;
      }
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as UserProfile);
        } else {
          // Profile might be in the process of being created by the backend function.
          // We don't set to null immediately to avoid UI flashes.
        }
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setCurrentUser(null);
      });

      return () => unsubscribeProfile();
  }, [firebaseUser]);

  const isAdmin = currentUser?.role === 'admin' && currentUser?.uid === ADMIN_UID;

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };
  
  const linkAccount = async (credential: AuthCredential, newUsername: string) => {
    if (!auth.currentUser) throw new Error("No user to link.");
    
    // Crucially, get the local profile *before* linking, as the UID will change.
    const guestProfile = localProfile;
    
    await linkWithCredential(auth.currentUser, credential);
    
    // Now that the user is permanent, update their profile with the new username and the old guest data
    await callFirebaseFunction('updateUserProfile', {
        username: newUsername,
        countryCode: guestProfile?.countryCode || '',
        gender: guestProfile?.gender || ''
    });

    clearLocalProfile();
  };

  const updateUserProfile = async (username: string, countryCode: string, gender: string) => {
    if (isAnonymous && firebaseUser) {
        const profile = { username, countryCode, gender };
        saveLocalProfile(profile);
        setLocalProfile(profile);
        window.dispatchEvent(new Event('local-profile-updated')); 
        return;
    }

    if (!auth.currentUser) {
      throw new Error("No authenticated user found.");
    }
    
    // Call the Cloud Function to update the profile
    await callFirebaseFunction('updateUserProfile', { username, countryCode, gender });
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
    isNotificationsEnabled,
    requestNotificationPermission,
    canInstall: !!deferredPrompt,
    triggerInstallPrompt,
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
