
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthFormCard
      title="Crear una Cuenta"
      description="Únete a WikiStars5 para calificar, discutir y personalizar tu perfil."
      footerText="¿Ya tienes una cuenta?"
      footerLinkText="Iniciar Sesión"
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthFormCard>
  );
}
