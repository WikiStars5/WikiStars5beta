"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus } from 'lucide-react';

const signupFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "El nombre de usuario no puede exceder los 30 caracteres."),
  email: z.string().email("Por favor, introduce un correo electrónico válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

// This page is intentionally not linked in the main UI and is meant for admin/manual registration.
// The primary user flow is anonymous sign-in with account linking.
export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // The onUserCreate Cloud Function will handle creating the Firestore profile.
      // We just need to update the Auth display name here.
      await updateProfile(userCredential.user, {
        displayName: data.username,
      });

      toast({
        title: "¡Cuenta Creada!",
        description: "Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.",
      });
      router.push('/login');
      router.refresh();
    } catch (error: any) {
      console.error("Error during signup:", error);
      let message = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo electrónico ya está en uso. Por favor, intenta iniciar sesión.';
      }
      toast({ title: "Error en el Registro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Crear Cuenta de Administrador</CardTitle>
          <CardDescription>Usa esta página para registrar nuevas cuentas de administrador o de prueba.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Controller name="username" control={control} render={({ field }) => <Input id="username" {...field} />} />
              {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" {...field} />} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Controller name="password" control={control} render={({ field }) => <Input id="password" type="password" {...field} />} />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4"/>}
              Crear Cuenta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
