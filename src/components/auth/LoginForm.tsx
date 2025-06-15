// === src/components/auth/LoginForm.tsx ===
// Componente de formulario de inicio de sesión con Email/Contraseña.
// Este es una exportación NOMBRADA para encajar con { LoginForm } en page.tsx.

"use client"; // Este componente debe ser un Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Importa la función de login
import { auth } from '@/lib/firebase'; // Importa tu instancia de auth de Firebase

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react'; // Para el icono de error

// Cambiado a una exportación nombrada: 'export function' en lugar de 'export default function'
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Intenta iniciar sesión con Email y Contraseña
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Inicio de sesión exitoso!");
      // Redirige al panel de administración después del login exitoso
      router.push('/admin/figures'); 
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err.message);
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Formato de correo electrónico inválido.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // AuthFormCard se encargará del div principal que contiene esto.
    // Este componente solo proporciona el formulario interno.
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
          placeholder="admin@wikistars5.com"
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
        />
      </div>
      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </div>
    </form>
  );
}

