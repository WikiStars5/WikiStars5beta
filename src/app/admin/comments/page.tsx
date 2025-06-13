import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCommentsForModeration } from "@/lib/actions/commentActions";
import { CommentModerationList } from "@/components/admin/CommentModerationList";
import { MessageSquareWarning } from "lucide-react";

export const revalidate = 0; // Ensure data is re-fetched on each request

export default async function AdminCommentsPage() {
  const comments = await getAllCommentsForModeration();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-headline">Moderate Comments</CardTitle>
        </div>
        <CardDescription>Review and approve or reject user-submitted comments from Firestore.</CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length > 0 ? (
          <CommentModerationList initialComments={comments} />
        ) : (
          <p className="text-center text-muted-foreground py-8">No comments are currently pending moderation or recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}
