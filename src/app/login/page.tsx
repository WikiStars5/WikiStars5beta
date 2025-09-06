
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, LogIn } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: 'Bienvenido de nuevo.',
      });
      router.push('/profile'); // Redirect to profile to see admin options
      router.refresh();
    } catch (error: any) {
      // This is the expected flow for a failed login, not an application error.
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast({
          title: 'Error al Iniciar Sesión',
          description: 'El correo electrónico o la contraseña son incorrectos.',
          variant: 'destructive',
        });
      } else {
        // Handle other, unexpected errors
        console.error('Error during login:', error);
        toast({
          title: 'Error al Iniciar Sesión',
          description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
          <CardDescription>Accede a tu cuenta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" placeholder="tu@email.com" {...field} />}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
               <Controller
                name="password"
                control={control}
                render={({ field }) => <Input id="password" type="password" {...field} />}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
            <Separator />
            <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Regístrate
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
