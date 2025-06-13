import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthFormCard
      title="Welcome Back!"
      description="Log in to your WikiStars5 account to continue."
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthFormCard>
  );
}
