
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ImageOff, PlusCircle, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FamilyTreeDisplayProps {
  figure: Figure;
  allFigures: Figure[]; // Para futuras vinculaciones
}

// Componente para los botones de añadir relación
const AddRelationButton = ({ onClick, label, positionClass, title }: { onClick: () => void; label: string, positionClass: string, title: string }) => (
  <Button
    variant="outline"
    size="icon"
    className={`absolute ${positionClass} rounded-full w-10 h-10 bg-card hover:bg-primary/10 border-primary text-primary z-10 shadow-lg flex items-center justify-center`}
    onClick={onClick}
    aria-label={label}
    title={title}
  >
    <PlusCircle className="h-6 w-6" />
  </Button>
);


export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const handleAddParents = () => {
    // TODO: Implementar lógica para añadir padres (abrir modal/formulario)
    // Por ejemplo, podría abrir un dropdown con "Añadir Padre" y "Añadir Madre"
    alert("Funcionalidad para añadir Padres/Madre (ej. Papá, Mamá) aún no implementada.");
    console.log("Añadir Padres para:", figure.name);
  };

  const handleAddPartner = () => {
    // TODO: Implementar lógica para añadir pareja (abrir modal/formulario)
    // Por ejemplo, podría abrir un dropdown con "Añadir Esposo/a" y "Añadir Novio/a"
    alert("Funcionalidad para añadir Pareja (ej. Esposo, Novio) aún no implementada.");
    console.log("Añadir Pareja para:", figure.name);
  };

  const handleAddChildren = () => {
    // TODO: Implementar lógica para añadir hijos (abrir modal/formulario)
    alert("Funcionalidad para añadir Hijos aún no implementada.");
    console.log("Añadir Hijos para:", figure.name);
  };

  const handleEditFigureCard = () => {
    // TODO: Implementar lógica para editar la tarjeta/figura
    // Podría redirigir a la página de edición de figura o abrir un modal específico para editar datos familiares aquí.
    alert("Funcionalidad para EDITAR la tarjeta de la figura aún no implementada.");
    console.log("Editar tarjeta de:", figure.name);
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-[500px] w-full">
      <div className="relative" style={{ marginBottom: '40px', marginTop: '40px', marginRight: '40px', marginLeft: '40px' }}> {/* Espacio para los botones flotantes */}
        {/* Botón Añadir Padres (arriba) */}
        <AddRelationButton
          onClick={handleAddParents}
          label="Añadir Padres"
          title="Añadir Padre o Madre"
          positionClass="-top-12 left-1/2 -translate-x-1/2 transform"
        />

        {/* Tarjeta Central de la Figura Principal */}
        <Card className="w-60 md:w-64 shadow-xl border-2 border-primary/30 relative overflow-visible bg-card">
          <CardHeader className="p-0">
            <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-primary/20">
              {figure.photoUrl ? (
                <Image
                  src={figure.photoUrl}
                  alt={`Imagen de ${figure.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 240px, 256px"
                  data-ai-hint="figure portrait"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder abstract person">
                  <ImageOff className="w-16 h-16" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2 text-sm">
            <h3 className="text-md font-semibold text-center text-primary truncate" title={figure.name}>
              {figure.name}
            </h3>
            
            <div className="space-y-1">
              <Label htmlFor={`imageUrl-${figure.id}`} className="text-xs text-muted-foreground">
                Url de la imagen: <span className="italic">(esto solo es visible cuando se edita)</span>
              </Label>
              <Input
                id={`imageUrl-${figure.id}`}
                type="text"
                value={figure.photoUrl || ''}
                readOnly // Este campo se llenará/editará mediante el botón EDITAR
                className="text-xs h-7 bg-muted/30 cursor-default"
                placeholder="Link de dominio permitido"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 py-1 h-auto text-xs border-primary/40 text-primary/70 hover:bg-primary/10 hover:text-primary"
              onClick={handleEditFigureCard}
              // disabled // Habilitar cuando la funcionalidad esté lista
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              EDITAR
            </Button>
          </CardContent>
        </Card>

        {/* Botón Añadir Pareja (lateral derecho) */}
        <AddRelationButton
          onClick={handleAddPartner}
          label="Añadir Pareja"
          title="Añadir Pareja (ej. Esposo/a, Novio/a)"
          positionClass="top-1/2 -right-12 -translate-y-1/2 transform"
        />

        {/* Botón Añadir Hijos (abajo) */}
        <AddRelationButton
          onClick={handleAddChildren}
          label="Añadir Hijos"
          title="Añadir Hijos"
          positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform"
        />
      </div>
      <CardDescription className="text-center mt-6 text-xs px-4 max-w-md">
        Esta es la vista inicial para construir el árbol genealógico. Haz clic en los botones (+) para añadir familiares.
        La funcionalidad completa de adición y edición se implementará en los próximos pasos.
      </CardDescription>
    </div>
  );
};

