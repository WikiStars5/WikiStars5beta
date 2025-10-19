
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { 
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { UserProfile, LocalProfile, Notification } from '@/lib/types';
import { doc, onSnapshot, getDoc, updateDoc, setDoc, collectionGroup, query, Timestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { ADMIN_UID } from '@/config/admin';
import { useLocalProfile } from './use-local-profile';
import { useToast } from './use-toast';
import { useCommentThread } from './use-comment-thread';
import { findRootCommentRef } from '@/lib/utils';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useRouter } from 'next/navigation';
import { callFirebaseFunction } from '@/lib/firebase';

// --- Firebase Initialization (Singleton Pattern for Client-Side) ---
const firebaseConfig = {
  "projectId": "wikistars5-2yctr",
  "appId": "1:939359993461:web:8228c2d11941f46e95823c",
  "storageBucket": "wikistars5-2yctr.firebasestorage.app",
  "apiKey": "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  "authDomain": "wikistars5-2yctr.firebaseapp.com",
  "measurementId": "G-8MY8KTGXP3",
  "messagingSenderId": "939359993461"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- Auth Context Definition ---
interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  localProfile: LocalProfile | null;
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

// --- Auth Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  
  const { localProfile, saveLocalProfile, clearLocalProfile } = useLocalProfile(firebaseUser?.uid);
  const { toast } = useToast();
  const { openCommentThread } = useCommentThread();
  const router = useRouter();

  // Effect for handling PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Main authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setFirebaseUser(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setFirebaseUser(userCredential.user);
        } catch (error) {
          console.error("CRITICAL: Anonymous sign-in failed:", error);
          toast({
            title: "Error de Conexión Crítico",
            description: "No se pudo iniciar una sesión de invitado. La aplicación puede no funcionar.",
            variant: "destructive",
          });
          setFirebaseUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, [toast]);

  // Effect to fetch user profile from Firestore once authenticated
  useEffect(() => {
    if (firebaseUser) {
      if (firebaseUser.isAnonymous) {
        setCurrentUser(null); // Anonymous users don't have a Firestore profile
        setIsLoading(false);
      } else {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserProfile;
            setCurrentUser(userData);
            setIsNotificationsEnabled(!!userData.fcmToken);
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
      }
    } else {
      // No firebaseUser yet, so we are still loading
      setCurrentUser(null);
    }
  }, [firebaseUser]);

    // Global listener for new replies to user's comments
    useEffect(() => {
        if (!firebaseUser || firebaseUser.isAnonymous || isLoading) return;

        const repliesQuery = query(collectionGroup(db, 'replies'));
        
        const unsubscribe = onSnapshot(repliesQuery, async (snapshot) => {
            for (const docChange of snapshot.docChanges()) {
                if (docChange.type !== 'added') continue;

                const reply = docChange.doc.data() as Comment;
                const replyTime = (reply.createdAt as Timestamp)?.toDate();
                
                // Process only recent replies to avoid spamming on load
                if (!replyTime || (new Date().getTime() - replyTime.getTime()) > 60000) continue;
                if (reply.authorId === firebaseUser.uid) continue;

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
                    audio.play().catch(() => {});

                    toast({
                        title: `💬 Nueva respuesta en ${figureName}`,
                        description: `${reply.authorName} respondió a tu comentario.`,
                        action: React.createElement(
                            'button',
                            {
                                onClick: () => openCommentThread(rootCommentRef.path, docChange.doc.id),
                                className: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            },
                            'Ver'
                        ),
                    });

                    // Logic to store notification in localStorage
                }
            }
        });

        return () => unsubscribe();
    }, [firebaseUser, isLoading, openCommentThread, toast]);


  const isAdmin = !!(currentUser && currentUser.role === 'admin' && currentUser.uid === ADMIN_UID);
  const isAnonymous = firebaseUser ? firebaseUser.isAnonymous : true;

  const signIn = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signUp = async (email: string, pass: string, username: string) => {
     await createUserWithEmailAndPassword(auth, email, pass);
     // The onUserCreate function will handle profile creation.
     // We just need to ensure the username is set if provided.
     if (auth.currentUser) {
         const userRef = doc(db, "users", auth.currentUser.uid);
         await updateDoc(userRef, { username: username });
     }
  };

  const logout = async () => {
    await auth.signOut();
    // After logging out, a new anonymous user will be created by onAuthStateChanged
    // so we redirect to home.
    router.push('/');
    // Clear any user-specific state if needed
    setCurrentUser(null);
    setFirebaseUser(null);
    clearLocalProfile();
  };

  const updateUserProfile = async (username: string, countryCode: string, gender: string) => {
    if (isAnonymous && firebaseUser) {
      const profile = { username, countryCode, gender };
      saveLocalProfile(profile);
      window.dispatchEvent(new Event('local-profile-updated'));
    } else if(firebaseUser) {
        const payload = { username, countryCode, gender };
        await callFirebaseFunction('updateUserProfile', payload);
    }
  };

  const requestNotificationPermission = async () => {
      // Notification permission logic here
      if (!firebaseUser || isAnonymous) return;

      try {
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' }); // You need to add your VAPID key
        if (currentToken) {
            await updateDoc(doc(db, 'users', firebaseUser.uid), { fcmToken: currentToken });
            setIsNotificationsEnabled(true);
            toast({ title: "¡Notificaciones activadas!" });
        } else {
            toast({ title: "Permiso de notificación necesario", description: "Por favor, permite las notificaciones en tu navegador."});
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
        toast({ title: "Error", description: "No se pudieron activar las notificaciones.", variant: "destructive" });
      }
  };

  const triggerInstallPrompt = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            toast({ title: "¡Aplicación instalada!" });
        }
        setDeferredPrompt(null);
    }
  };

  const value = {
    firebaseUser,
    currentUser,
    localProfile,
    isAdmin,
    isLoading,
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
