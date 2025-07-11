
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // Create a session cookie by calling our new API route
      const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
          throw new Error('Failed to create session.');
      }
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: `¡Bienvenido de nuevo, ${user.displayName || user.email}!`,
      });
      router.push('/home');
      router.refresh(); // Refresh to apply server-side logic with the new cookie

    } catch (authError: any) {
      console.error(
        "LoginForm: Firebase Authentication error:",
        authError.message
      );
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Formato de correo electrónico inválido.';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
      } else if (authError.message) {
        errorMessage = `Error de inicio de sesión: ${authError.message}`;
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
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </div>
    </form>
  );
}
