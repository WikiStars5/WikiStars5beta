
"use client";

import { useState } from 'react';
import { useRouter } from 'next-intl/client'; // Changed to next-intl's useRouter
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfileExists } from '@/lib/userData';
import { useToast } from "@/hooks/use-toast";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('LoginForm');
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
      
      toast({
        title: t('successTitle'),
        description: t('successDescription', {username: user.displayName || user.email}),
      });
      router.push('/home'); // next-intl router handles locale automatically

      if (user) {
        try {
          await ensureUserProfileExists(user);
        } catch (profileError: any) {
          console.error(
            "LoginForm: Error during ensureUserProfileExists after successful Firebase Auth login:",
            profileError.message
          );
        }
      }
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
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          disabled={isLoading}
        />
      </div>
      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? t('loggingInButton') : t('loginButton')}
        </Button>
      </div>
    </form>
  );
}
