
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  figureName: string;
  figureId: string;
}

export function ShareButton({ figureName, figureId }: ShareButtonProps) {
  const { toast } = useToast();
  const [canShareNatively, setCanShareNatively] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanShareNatively(true);
    }
  }, []);

  const handleShare = async () => {
    if (typeof window === 'undefined') return; // Ensure window is defined

    const shareUrl = `${window.location.origin}/figures/${figureId}`;
    const shareTitle = `Check out ${figureName} on WikiStars5!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Rate and discuss ${figureName} on WikiStars5.`,
          url: shareUrl,
        });
        toast({ title: "Shared successfully!" });
      } catch (error) {
        console.error("Error sharing:", error);
        // Avoid toast if error is "AbortError" (user cancelled share dialog)
        if ((error as DOMException)?.name !== 'AbortError') {
          toast({ title: "Could not share", description: "Sharing was cancelled or failed.", variant: "destructive" });
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "Profile link copied to clipboard." });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast({ title: "Could not copy link", variant: "destructive" });
      }
    }
  };

  // Render a placeholder or the fallback icon until client-side check is complete
  // to avoid hydration mismatch if initial server render differs too much.
  // For this specific case, LinkIcon is a safe default.
  const ShareOrLinkIcon = canShareNatively ? Share2 : LinkIcon;

  return (
    <Button variant="outline" onClick={handleShare} size="icon" aria-label={`Share ${figureName}'s profile`}>
      {isClient ? <ShareOrLinkIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" /> }
    </Button>
  );
}
