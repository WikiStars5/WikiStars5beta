
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfileExists } from '@/lib/userData';
import { useToast } from "@/hooks/use-toast";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Attempt Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("LoginForm: User signed in with Firebase Auth:", user.uid);

      // Step 2: If Firebase Auth is successful, show success toast and redirect immediately
      toast({
        title: "Inicio de Sesión Exitoso",
        description: `¡Bienvenido de nuevo, ${user.displayName || user.email}!`,
      });
      router.push('/home');

      // Step 3: Attempt to ensure user profile exists in Firestore silently.
      // Errors here will be logged but will not block the user or show in login form error UI.
      if (user) {
        try {
          await ensureUserProfileExists(user);
          console.log("LoginForm: ensureUserProfileExists completed for UID:", user.uid);
        } catch (profileError: any) {
          console.error(
            "LoginForm: Error during ensureUserProfileExists after successful Firebase Auth login:",
            profileError.message,
            "Código:",
            profileError.code,
            "Full error object:",
            profileError
          );
          // Do NOT setError(profileError.message) here, as login was successful.
          // This error is about profile sync, not auth.
        }
      }
    } catch (authError: any) {
      // This catch block now ONLY handles errors from signInWithEmailAndPassword (core Firebase Auth)
      console.error(
        "LoginForm: Firebase Authentication error:",
        authError.message,
        "Código:",
        authError.code,
        "Full error object:",
        authError
      );
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (authError.message && authError.message.includes("Firestore_Profile_Error")) {
        // This case should ideally not be reached if ensureUserProfileExists errors are handled separately
        errorMessage = `Error de autenticación, y problema al cargar/actualizar tu perfil en Firestore: ${authError.message.replace("Firestore_Profile_Error:", "")}`;
      } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Formato de correo electrónico inválido.';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
      } else if (authError.message && authError.message.toLowerCase().includes('maximum call stack size exceeded')) {
        errorMessage = "Error Interno Inesperado (Maximum call stack size exceeded) durante el inicio de sesión. Por favor, revisa la consola del navegador.";
      } else if (authError.message) {
        errorMessage = `Error de inicio de sesión: ${authError.message}${authError.code ? ` (Código: ${authError.code})` : ''}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error de inicio de sesión</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@ejemplo.com"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>
      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </div>
    </form>
  );
}
