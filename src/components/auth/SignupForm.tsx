
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation"; 
import { auth } from '@/lib/firebase';
import { ensureUserProfileExists } from "@/lib/userData";

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "El nombre de usuario debe tener al menos 2 caracteres." }).max(50, {message: "El nombre de usuario no debe exceder los 50 caracteres."}),
  email: z.string().email({ message: "Dirección de correo electrónico inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, {
          displayName: values.displayName,
        });
      }

      toast({
        title: "¡Cuenta Creada!",
        description: `¡Bienvenido a WikiStars5, ${user.displayName || user.email}!`,
      });
      router.push('/home'); 

      if (user) {
        try {
          await ensureUserProfileExists(user);
        } catch (profileError: any) {
          console.error(
            "SignupForm: Error during ensureUserProfileExists after successful Firebase Auth signup:",
            profileError.message
          );
        }
      }

    } catch (authError: any) {
      console.error("SignupForm onSubmit authError object:", authError);
      let displayErrorMessage = "No se pudo crear la cuenta. Intenta de nuevo.";
      
      if (authError.code === 'auth/email-already-in-use') {
        displayErrorMessage = "Esta dirección de correo electrónico ya está en uso.";
      } else if (authError.code === 'auth/invalid-email') {
        displayErrorMessage = "El formato del correo electrónico es inválido.";
      } else if (authError.code === 'auth/weak-password') {
        displayErrorMessage = "La contraseña es demasiado débil.";
      } else if (authError.message) {
        displayErrorMessage = `Error de registro: ${authError.message}`;
      }
      
      toast({
        title: "Registro Fallido",
        description: displayErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario Público</FormLabel>
              <FormControl>
                <Input placeholder="Tu Nombre" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@ejemplo.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="•••••••• (mín. 6 caracteres)" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
          {isLoading ? "Creando cuenta..." : "Registrarse"}
        </Button>
      </form>
    </Form>
  );
}
