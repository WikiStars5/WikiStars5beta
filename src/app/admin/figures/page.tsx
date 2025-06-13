import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FIGURES_DATA } from "@/lib/placeholder-data";
import { Figure } from "@/lib/types";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

async function getFigures(): Promise<Figure[]> {
  // Simulate fetching data
  return Promise.resolve(FIGURES_DATA);
}

export default async function AdminFiguresPage() {
  const figures = await getFigures();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
                  <TableHead className="text-center">Avg. Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {figures.map((figure) => (
                  <TableRow key={figure.id}>
                    <TableCell>
                      <Image 
                        src={figure.photoUrl} 
                        alt={figure.name} 
                        width={50} 
                        height={70} 
                        className="rounded object-cover"
                        data-ai-hint={figure.dataAiHint || "person"}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{figure.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{figure.description}</TableCell>
                    <TableCell className="text-center">{figure.averageRating.toFixed(1)} ({figure.totalRatings})</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="mr-1">
                        <Link href={`/admin/figures/${figure.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => alert(`Simulate delete for ${figure.name}`)}>
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
