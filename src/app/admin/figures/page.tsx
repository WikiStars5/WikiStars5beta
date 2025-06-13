

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FIGURES_DATA, deleteFigure as deleteFigureData } from "@/lib/placeholder-data"; // Use the mutable import
import type { Figure } from "@/lib/types";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminFigureImage } from "@/components/admin/AdminFigureImage";
// import { AdminDeleteFigureButton } from "@/components/admin/AdminDeleteFigureButton"; // For client-side deletion if needed

// This page will be server-rendered for now.
// For client-side interactions like delete without full reload, a client component would be needed.

async function getFigures(): Promise<Figure[]> {
  // Simulate fetching data
  // In a real app, this would fetch from a database.
  // The FIGURES_DATA is imported directly, which is fine for this simulation.
  return Promise.resolve(FIGURES_DATA);
}

export default async function AdminFiguresPage() {
  const figures = await getFigures();

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-headline">Manage Figures</CardTitle>
          <CardDescription>Create, edit, or delete public figure profiles.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/figures/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Figure
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {figures.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center w-[120px]">Avg. Rating</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {figures.map((figure) => (
                  <TableRow key={figure.id}>
                    <TableCell>
                      <AdminFigureImage figure={figure} />
                    </TableCell>
                    <TableCell className="font-medium">{figure.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{figure.description}</TableCell>
                    <TableCell className="text-center">
                      {figure.averageRating.toFixed(1)} ({figure.totalRatings})
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="mr-1">
                        <Link href={`/admin/figures/${figure.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      {/* Basic delete confirmation for now. In a real app, use a modal and proper state management. */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => {
                          if(confirm(`Are you sure you want to delete ${figure.name}? This cannot be undone.`)){
                            // This is a server component, so direct state manipulation isn't straightforward.
                            // For simulation, we'd need a client component or form action.
                            // For now, it will just alert.
                            alert(`Simulating delete for ${figure.name}. In a real app, this would refresh the list.`);
                            // deleteFigureData(figure.id); // This would modify in-memory store if server actions were set up or if this was a client component.
                            // router.refresh(); // Needs client component
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No figures found. Add one to get started!</p>
        )}
      </CardContent>
    </Card>
  );
}
