"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth'; // Import the useAuth hook

const signupFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "El nombre de usuario no puede exceder los 30 caracteres."),
  email: z.string().email("Por favor, introduce un correo electrónico válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth(); // Use our auth hook

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      await updateProfile(userCredential.user, {
        displayName: data.username,
      });

      toast({
        title: "¡Cuenta Creada!",
        description: "La nueva cuenta ha sido creada exitosamente.",
      });
      router.push('/admin/users'); // Redirect to user management
      router.refresh();
    } catch (error: any) {
      console.error("Error during signup:", error);
      let message = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo electrónico ya está en uso.';
      }
      toast({ title: "Error en el Registro", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
             <CardHeader>
                <CardTitle className="text-center">Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>No tienes permisos</AlertTitle>
                  <AlertDescription>
                    Esta página solo está disponible para administradores de la plataforma.
                  </AlertDescription>
                </Alert>
            </CardContent>
          </Card>
      </div>
    );
  }

  // Render the form only if the user is an admin
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Crear Nueva Cuenta</CardTitle>
          <CardDescription>Usa este formulario para registrar nuevas cuentas de administrador o prueba.</CardDescription>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4"/>}
              Crear Cuenta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}