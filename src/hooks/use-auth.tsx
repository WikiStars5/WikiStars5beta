
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { useFirebase } from '@/components/layout/FirebaseProvider';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser,
  type AuthCredential
} from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { UserProfile, LocalProfile, Comment, Notification } from '@/lib/types';
import { doc, onSnapshot, getDoc, setDoc, collectionGroup, query, Timestamp, onSnapshot as onCollectionSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
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
  signUp: (email: string, pass: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, countryCode: string, gender: string) => Promise<void>;
  canInstall: boolean;
  triggerInstallPrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, db, firebaseUser, isLoading: isFirebaseLoading } = useFirebase();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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
  }, [db]);

  const deleteFcmToken = useCallback(async (user: FirebaseUser) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { fcmToken: null });
    }
  }, [db]);
  
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
    if (!firebaseUser || isFirebaseLoading) return;
    
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
            
            const audio = new Audio('/audio/livechat.mp3');
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
  }, [firebaseUser, toast, isFirebaseLoading, openCommentThread, db]);

  useEffect(() => {
      if (!firebaseUser) {
        setCurrentUser(null);
        return;
      }
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as UserProfile);
        } else {
            // This might happen for a new anonymous user before their profile is created
            setCurrentUser(null);
        }
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setCurrentUser(null);
      });

      return () => unsubscribeProfile();
  }, [firebaseUser, db]);

  const isAdmin = currentUser?.role === 'admin' && currentUser?.uid === ADMIN_UID;

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signUp = async (email: string, pass: string, username: string) => {
    const anonymousUser = auth.currentUser;
    if (!anonymousUser || !anonymousUser.isAnonymous) {
      throw new Error("No hay una sesión de invitado para vincular.");
    }
    
    const guestProfile = localProfile;
    
    const credential = EmailAuthProvider.credential(email, pass);
    
    try {
      await linkWithCredential(anonymousUser, credential);
      await callFirebaseFunction('linkAnonymousToUser', {
          username: username,
          countryCode: guestProfile?.countryCode || '',
          gender: guestProfile?.gender || '',
      });
      clearLocalProfile();
    } catch (error: any) {
        console.error("Error linking account:", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este correo electrónico ya está en uso por otra cuenta.");
        }
        throw new Error("No se pudo crear la cuenta.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/');
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
    
    await callFirebaseFunction('updateUserProfile', { username, countryCode, gender });
  };

  const value = {
    firebaseUser,
    currentUser,
    localProfile,
    setLocalProfile,
    isAdmin,
    isLoading: isFirebaseLoading,
    isAnonymous,
    signIn,
    signUp,
    logout,
    updateUserProfile,
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
