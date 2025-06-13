
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, MessageSquareWarning, PlusCircle, AlertTriangle } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { getPendingCommentsCount } from "@/lib/actions/commentActions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added AlertTitle

export const revalidate = 0; // Ensure data is re-fetched

export default async function AdminDashboardPage() {
  let figures = [];
  let totalFigures = 0;
  let pendingModeration = 0;
  let fetchError: string | null = null;

  try {
    // These calls need to succeed for the admin dashboard to populate.
    // Ensure the authenticated admin user (UID: fjEZpqVvG4VOzwUdGyes7ufhqYH2)
    // has read permissions on 'figures' and 'comments' collections in Firestore Security Rules.
    figures = await getAllFiguresFromFirestore();
    totalFigures = figures.length;
    pendingModeration = await getPendingCommentsCount();
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    // Firebase permission errors often have a code like 'permission-denied'
    // or include "permission" in the message.
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
      fetchError = "Failed to fetch dashboard data due to missing or insufficient Firestore permissions. Please check your Firebase Security Rules in the Firebase console. Ensure the admin user (UID: fjEZpqVvG4VOzwUdGyes7ufhqYH2) has read access to 'figures' and 'comments' collections.";
    } else {
      fetchError = `An unexpected error occurred while fetching dashboard data: ${error.message || 'Unknown error'}`;
    }
  }

  const totalUsers = 150; // Placeholder, as user management is not in Firestore yet

  return (
    <div className="space-y-8">
      {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" /> {/* Ensure icon is visible */}
          <AlertTitle>Permission Error</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Admin Dashboard</CardTitle>
          <CardDescription>Overview of StarSage application status. Figure data and comment counts from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Figures</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fetchError ? 'N/A' : totalFigures}</div>
                <p className="text-xs text-muted-foreground">profiles managed in Firestore</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users (Simulated)</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">registered users</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comments for Moderation</CardTitle>
                <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fetchError ? 'N/A' : pendingModeration}</div>
                <p className="text-xs text-muted-foreground">items needing review from Firestore</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/admin/figures/new"><PlusCircle className="mr-2 h-4 w-4" /> Add New Figure</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/figures"><ListOrdered className="mr-2 h-4 w-4" /> Manage Figures</Link>
          </Button>
           <Button variant="outline" asChild> {/* Enabled this button */}
            <Link href="/admin/comments"><MessageSquareWarning className="mr-2 h-4 w-4" />Moderate Comments</Link>
          </Button>
           <Button variant="outline" disabled asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    