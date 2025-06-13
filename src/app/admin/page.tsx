
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BarChart3, MessageSquareWarning, PlusCircle, ListOrdered } from "lucide-react";
import { FIGURES_DATA } from "@/lib/placeholder-data"; // Assuming this holds all figures

export default function AdminDashboardPage() {
  // These would be dynamic in a real app
  const totalFigures = FIGURES_DATA.length;
  const totalUsers = 150; // Placeholder
  const pendingModeration = 5; // Placeholder

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Admin Dashboard</CardTitle>
          <CardDescription>Overview of WikiStars5 application status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Figures</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFigures}</div>
                <p className="text-xs text-muted-foreground">profiles managed</p>
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
                <CardTitle className="text-sm font-medium">Comments for Moderation (Simulated)</CardTitle>
                <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingModeration}</div>
                <p className="text-xs text-muted-foreground">items needing review</p>
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
           <Button variant="outline" disabled asChild>
            <Link href="/admin/comments">Moderate Comments</Link>
          </Button>
           <Button variant="outline" disabled asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
