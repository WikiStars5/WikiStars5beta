"use client";

import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  figureName: string;
  figureId: string;
}

export function ShareButton({ figureName, figureId }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/figures/${figureId}`;
    const shareTitle = `Check out ${figureName} on StarSage!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Rate and discuss ${figureName} on StarSage.`,
          url: shareUrl,
        });
        toast({ title: "Shared successfully!" });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({ title: "Could not share", description: "Sharing was cancelled or failed.", variant: "destructive" });
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

  return (
    <Button variant="outline" onClick={handleShare} size="icon" aria-label={`Share ${figureName}'s profile`}>
      {navigator.share ? <Share2 className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
    </Button>
  );
}
