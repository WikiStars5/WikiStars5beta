
"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, query, collection, where, getDocs, type Firestore } from 'firebase/firestore';
import { User, LogIn, UserPlus, LogOut, Loader2, AlertTriangle, CheckCircle, Eye, EyeOff, KeyRound, AtSign, UserCircle2 } from 'lucide-react';

// --- Types and Interfaces ---
interface UserProfile {
  uid: string;
  email: string;
  username: string;
  password?: string; // Included for storage, but should not be passed around in the UI
}

interface AuthFormProps {
  onAuthSuccess: (user: UserProfile) => void;
  setView: (view: 'login' | 'register') => void;
  db: Firestore | null;
  appId: string;
}

interface ModalProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

// --- Firebase Configuration ---
// These are placeholders for the global variables that will be provided.
declare global {
  var __firebase_config: any;
  var __app_id: string;
}

const firebaseConfig = typeof window !== 'undefined' ? window.__firebase_config : {};
const appId = typeof window !== 'undefined' ? window.__app_id : 'default-app-id';

// --- Helper Functions ---
const generateUserId = () => crypto.randomUUID();

// --- Main Application Component ---
export default function HomePage() {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');

  // Effect for Firebase Initialization and Session Management
  useEffect(() => {
    try {
      const firebaseApp = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(firebaseApp);
      setApp(firebaseApp);
      setDb(firestoreDb);

      // Check for a persisted session in localStorage
      const storedUserId = localStorage.getItem('wikistars5_userId');
      if (storedUserId && firestoreDb) {
        const fetchUser = async () => {
          const userProfilePath = `artifacts/${appId}/users/${storedUserId}/profiles/${storedUserId}`;
          const userDocRef = doc(firestoreDb, userProfilePath);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser(userDocSnap.data() as UserProfile);
          } else {
            // Clear session if user not found in DB
            localStorage.removeItem('wikistars5_userId');
          }
          setIsLoading(false);
        };
        fetchUser();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('wikistars5_userId', user.uid);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('wikistars5_userId');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400">WikiStars5</h1>
          <p className="text-gray-400 mt-2">Plataforma de Percepción Pública</p>
        </header>

        {currentUser ? (
          <AuthenticatedView user={currentUser} onLogout={handleLogout} />
        ) : (
          <div>
            {view === 'login' ? (
              <LoginView onAuthSuccess={handleAuthSuccess} setView={setView} db={db} appId={appId} />
            ) : (
              <RegisterView onAuthSuccess={handleAuthSuccess} setView={setView} db={db} appId={appId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Authenticated User View Component ---
function AuthenticatedView({ user, onLogout }: { user: UserProfile, onLogout: () => void }) {
  return (
    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-2xl text-center animate-fade-in">
      <User className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Bienvenido, {user.username}!</h2>
      <p className="text-gray-400 mb-6">Has iniciado sesión correctamente.</p>
      <div className="bg-gray-900 p-3 rounded-md text-sm text-yellow-400 font-mono break-all">
        <span className="text-gray-500">Tu ID de Usuario:</span> {user.uid}
      </div>
      <button
        onClick={onLogout}
        className="mt-8 w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
      >
        <LogOut className="mr-2 h-5 w-5" />
        Cerrar Sesión
      </button>
    </div>
  );
}

// --- Login View Component ---
function LoginView({ onAuthSuccess, setView, db, appId }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !db) {
      setModal({ type: 'error', message: 'Por favor, completa todos los campos.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const usersRef = collection(db, `artifacts/${appId}/users`);
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("El correo electrónico no está registrado.");
      }
      
      let userFound: UserProfile | null = null;
      let passwordMatch = false;
      
      for (const userDoc of querySnapshot.docs) {
          const userId = userDoc.id;
          const profilePath = `artifacts/${appId}/users/${userId}/profiles/${userId}`;
          const profileDocRef = doc(db, profilePath);
          const profileDocSnap = await getDoc(profileDocRef);

          if (profileDocSnap.exists()) {
              const userData = profileDocSnap.data() as UserProfile;
              if (userData.password === password) {
                  userFound = userData;
                  passwordMatch = true;
                  break;
              }
          }
      }

      if (!passwordMatch || !userFound) {
        throw new Error("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
      }
      
      setModal({ type: 'success', message: '¡Inicio de sesión exitoso! Redirigiendo...' });
      setTimeout(() => onAuthSuccess(userFound!), 1000);

    } catch (error: any) {
      setModal({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-2xl animate-fade-in">
      {modal && <Modal type={modal.type} message={modal.message} onClose={() => setModal(null)} />}
      <h2 className="text-3xl font-bold text-center text-white mb-6">Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="text-sm font-bold text-gray-400 mb-2 block">Correo Electrónico</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="tu@email.com"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-gray-400 mb-2 block">Contraseña</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-yellow-800 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
        </button>
      </form>
      <p className="text-center text-gray-400 mt-6 text-sm">
        ¿No tienes una cuenta?{' '}
        <button onClick={() => setView('register')} className="font-bold text-yellow-400 hover:underline">
          Regístrate aquí
        </button>
      </p>
    </div>
  );
}

// --- Register View Component ---
function RegisterView({ onAuthSuccess, setView, db, appId }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword || !db) {
      setModal({ type: 'error', message: 'Por favor, completa todos los campos.' });
      return;
    }
    if (password !== confirmPassword) {
      setModal({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }
    setIsSubmitting(true);

    try {
      // Check if email already exists
      const usersRef = collection(db, `artifacts/${appId}/users`);
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error("Este correo electrónico ya está registrado.");
      }

      // Create new user profile
      const newUserId = generateUserId();
      const userProfile: UserProfile = {
        uid: newUserId,
        email,
        username,
        password, // WARNING: Storing plaintext password for demo purposes only.
      };
      
      // Firestore paths
      const userDocRef = doc(db, `artifacts/${appId}/users/${newUserId}`);
      const profileDocRef = doc(db, `artifacts/${appId}/users/${newUserId}/profiles/${newUserId}`);
      
      // Save user data
      await setDoc(userDocRef, { email: userProfile.email }); // Store email in parent for querying
      await setDoc(profileDocRef, userProfile);

      setModal({ type: 'success', message: '¡Registro exitoso! Iniciando sesión...' });
      setTimeout(() => onAuthSuccess(userProfile), 1000);

    } catch (error: any) {
      setModal({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-2xl animate-fade-in">
      {modal && <Modal type={modal.type} message={modal.message} onClose={() => setModal(null)} />}
      <h2 className="text-3xl font-bold text-center text-white mb-6">Crear Cuenta</h2>
      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label className="text-sm font-bold text-gray-400 mb-2 block">Correo Electrónico</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="tu@email.com" required />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-gray-400 mb-2 block">Nombre de Usuario</label>
          <div className="relative">
            <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="TuNombreDeUsuario" required />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-gray-400 mb-2 block">Contraseña</label>
           <div className="relative">
             <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
             <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="••••••••" required />
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400">
               {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
             </button>
           </div>
        </div>
        <div>
          <label className="text-sm font-bold text-gray-400 mb-2 block">Confirmar Contraseña</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="••••••••" required />
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center bg-gray-900 p-2 rounded-md">
           <span className="font-bold text-yellow-500">ADVERTENCIA:</span> Las contraseñas se guardan sin encriptar. Este sistema es solo para demostración y no es seguro para producción.
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-yellow-800 disabled:cursor-not-allowed">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
          {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>
      <p className="text-center text-gray-400 mt-6 text-sm">
        ¿Ya tienes una cuenta?{' '}
        <button onClick={() => setView('login')} className="font-bold text-yellow-400 hover:underline">
          Inicia sesión aquí
        </button>
      </p>
    </div>
  );
}


// --- Modal Component for Notifications ---
function Modal({ type, message, onClose }: ModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 rounded-lg shadow-lg text-white animate-slide-down-fade z-50 ${isSuccess ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'}`}>
      <div className="flex items-center">
        {isSuccess ? <CheckCircle className="h-6 w-6 mr-3" /> : <AlertTriangle className="h-6 w-6 mr-3" />}
        <p className="flex-1">{message}</p>
        <button onClick={onClose} className="ml-4">&times;</button>
      </div>
    </div>
  );
}

// Minimal CSS for animations (could be in a separate CSS file)
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  body { font-family: 'Inter', sans-serif; }
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }

  @keyframes slide-down-fade {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  .animate-slide-down-fade { animation: slide-down-fade 0.5s ease-out forwards; }
`;
const styleSheet = typeof document !== 'undefined' ? document.createElement("style") : null;
if (styleSheet) {
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  if(document.head) document.head.appendChild(styleSheet);
}
