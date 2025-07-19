"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link"; 
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AuthFormCardProps {
  title: string;
  description: string;
  footerLinkHref: string;
  footerLinkText: string;
  footerText: string;
  onGoogleSignIn: () => Promise<void>; 
  isGoogleLoading: boolean;
}

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.8 0 265.5S110.3 19 244 19c70.5 0 131.5 30.4 176.1 79.9l-67.4 64.9C333.5 138.8 291.1 116.4 244 116.4c-84.3 0-153.9 68.7-153.9 153.1S159.7 412.6 244 412.6c97.7 0 135-71.2 139.1-105.3H244v-75.5h236.1c1.4 9.2 2.8 19.3 2.8 29.9z"></path>
  </svg>
);

export function AuthFormCard({ title, description, footerLinkHref, footerLinkText, footerText, onGoogleSignIn, isGoogleLoading }: AuthFormCardProps) {

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="mt-4">
              <Button
                variant="outline"
                className="w-full text-base py-6"
                onClick={onGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continuar con Google
              </Button>
            </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            {footerText}{" "}
            <Link href={footerLinkHref} className="font-medium text-primary hover:underline">
              {footerLinkText}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
