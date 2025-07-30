
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AtSign, KeyRound, Eye, EyeOff, Loader2, UserPlus, UserCircle2, Map, VenusMars } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';

const registerUserCallable = httpsCallable(getFunctions(app), 'registerUser');

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword || !countryCode || !gender) {
      toast({ title: "Campos Requeridos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      await registerUserCallable({ email, password, username, countryCode, gender });
      
      toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada. Ahora, inicia sesión." });
      router.push('/login');

    } catch (error: any) {
      console.error("Signup Error:", error);
      let errorMessage = "Ocurrió un error. Por favor, intenta de nuevo.";
      // Firebase callable functions wrap errors, so we look at error.message
      if (error.message) {
        if (error.message.includes('auth/email-already-in-use') || error.message.includes('EMAIL_EXISTS')) {
          errorMessage = 'Este correo electrónico ya está registrado.';
        } else if (error.message.includes('auth/weak-password') || error.message.includes('WEAK_PASSWORD')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      toast({
        title: "Error en el Registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border p-8 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-6">Crear Cuenta</h2>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Correo Electrónico</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="tu@email.com" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Nombre de Usuario</label>
              <div className="relative">
                <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" placeholder="TuNombreDeUsuario" required />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">País</label>
               <CountryCombobox value={countryCode} onChange={setCountryCode} />
            </div>

             <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Sexo</label>
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu sexo" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Contraseña</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" placeholder="Mínimo 6 caracteres" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Confirmar Contraseña</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10" placeholder="••••••••" required />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>
          <p className="text-center text-muted-foreground mt-6 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
