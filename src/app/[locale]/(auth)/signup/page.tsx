
"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { SignupForm } from "@/components/auth/SignupForm";
import {useTranslations} from 'next-intl';


export default function SignupPage() {
  const t = useTranslations('SignupForm');
  return (
    <AuthFormCard
      title={t('title')}
      description={t('description')}
      footerText={t('alreadyHaveAccount')}
      footerLinkText={t('loginLink')}
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthFormCard>
  );
}
