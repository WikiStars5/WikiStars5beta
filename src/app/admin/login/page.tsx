
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn, isAdmin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = form;
  
  useEffect(() => {
    // If the user is already an admin, redirect them away from the login page.
    // This must be in a useEffect to avoid updating state during render.
    if (isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
      toast({
        title: "¡Sesión Iniciada!",
        description: "Bienvenido de nuevo.",
      });
      // The useEffect will handle the redirect after this state change.
    } catch (err: any) {
      console.error("Login failed:", err);
      let errorMessage = "Ocurrió un error inesperado.";
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Correo electrónico o contraseña incorrectos.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
          break;
      }
      setError(errorMessage);
    }
  };
  
  // If the user is already admin, show a redirecting message while the useEffect runs.
  if (isAdmin) {
       return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Redirigiendo al panel de administración...</p>
            </div>
        );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Acceso de Administrador</CardTitle>
          <CardDescription>Inicia sesión para gestionar la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@wikistars.com"
                        {...field}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </Form>
           <p className="mt-4 text-center text-xs text-muted-foreground">
             <Link href="/" className="underline hover:text-primary">
                Volver a la página de inicio
             </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
