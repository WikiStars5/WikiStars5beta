
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button"; 

interface AuthFormCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footerLinkHref: string;
  footerLinkText: string;
  footerText: string;
  showOAuth?: boolean;
}

export function AuthFormCard({ title, description, children, footerLinkHref, footerLinkText, footerText, showOAuth = true }: AuthFormCardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {showOAuth && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    O continuar con
                  </span>
                </div>
              </div>
              {/* Placeholder for OAuth buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" disabled>Google</Button>
                <Button variant="outline" disabled>Facebook</Button>
              </div>
            </>
          )}
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
