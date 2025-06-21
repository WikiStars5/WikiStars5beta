"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation"; 
import { auth } from '@/lib/firebase';
import { GENDER_OPTIONS } from "@/config/genderOptions";
import { CountryCombobox } from "@/components/shared/CountryCombobox";

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "El nombre de usuario debe tener al menos 2 caracteres." }).max(50, {message: "El nombre de usuario no debe exceder los 50 caracteres."}),
  email: z.string().email({ message: "Dirección de correo electrónico inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  countryCode: z.string().min(1, { message: "Por favor, selecciona tu país." }),
  gender: z.string().min(1, { message: "Por favor, selecciona tu sexo." }),
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
      countryCode: "",
      gender: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Update the Auth user's profile (this is separate from Firestore)
      await updateProfile(user, {
        displayName: values.displayName,
      });

      // 3. User profile document in Firestore is no longer created here.
      // It will be created on first login or when visiting the profile page to avoid bugs.
      
      toast({
        title: "¡Cuenta Creada!",
        description: `¡Bienvenido a WikiStars5, ${user.displayName || user.email}!`,
      });
      router.push('/home'); 

    } catch (error: any) {
      console.error("SignupForm onSubmit error:", error);
      let displayErrorMessage = "No se pudo crear la cuenta. Intenta de nuevo.";
      
      if (error.code === 'auth/email-already-in-use') {
        displayErrorMessage = "Esta dirección de correo electrónico ya está en uso.";
      } else if (error.code === 'auth/invalid-email') {
        displayErrorMessage = "El formato del correo electrónico es inválido.";
      } else if (error.code === 'auth/weak-password') {
        displayErrorMessage = "La contraseña es demasiado débil.";
      } else if (error.message) {
        displayErrorMessage = `Error de registro: ${error.message}`;
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
        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>País</FormLabel>
              <CountryCombobox
                value={field.value}
                onChange={field.onChange}
                disabled={isLoading}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sexo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu sexo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.emoji && <span role="img" aria-label={gender.label} className="mr-2">{gender.emoji}</span>}
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
