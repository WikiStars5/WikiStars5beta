
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AtSign, KeyRound, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Campos Requeridos", description: "Por favor, ingresa tu correo y contraseña.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "¡Bienvenido de vuelta!", description: "Has iniciado sesión correctamente." });
      // CORRECTED: Redirect to profile page and then refresh to ensure all components get the new auth state.
      router.push('/profile');
      router.refresh(); 
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = "Ocurrió un error. Por favor, intenta de nuevo.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Correo o contraseña incorrectos.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "El inicio de sesión por correo electrónico no está habilitado. Contacta al administrador.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error al Iniciar Sesión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border p-8 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-6">Iniciar Sesión</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Correo Electrónico</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="tu@email.com" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Contraseña</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <p className="text-center text-muted-foreground mt-6 text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
