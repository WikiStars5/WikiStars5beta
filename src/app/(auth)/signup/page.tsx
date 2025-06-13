import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthFormCard
      title="Create an Account"
      description="Join WikiStars5 to rate and discuss public figures."
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthFormCard>
  );
}
