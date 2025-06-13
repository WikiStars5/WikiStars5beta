import { FigureForm } from "@/components/admin/FigureForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewFigurePage() {
  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Create New Figure Profile</CardTitle>
        <CardDescription>Fill in the details for the new public figure.</CardDescription>
      </CardHeader>
      <FigureForm />
    </div>
  );
}
