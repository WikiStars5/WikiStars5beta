
"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { LoginForm } from "@/components/auth/LoginForm";
import {useTranslations} from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('LoginForm');

  return (
    <AuthFormCard
      title={t('title')}
      description={t('description')}
      footerText={t('noAccount')}
      footerLinkText={t('signupLink')}
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthFormCard>
  );
}
