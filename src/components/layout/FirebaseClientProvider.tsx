"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FirebaseProvider } from "./FirebaseProvider";
import { Loader2 } from "lucide-react";

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // While rendering on the server, or before the client has mounted,
    // you can show a loader or nothing at all.
    return (
         <div className="fixed inset-0 flex items-center justify-center bg-background z-[200]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  // Once on the client, render the actual Firebase provider.
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
