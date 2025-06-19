
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff, UserCircle } from "lucide-react";

interface FamilyTreeDisplayProps {
  figure: Figure; // The main figure for whom the tree is displayed
  allFigures: Figure[]; // For linking to other existing profiles
}

interface FamilyNodeProps {
  member: FamilyMember;
  allFigures: Figure[];
  isMainFigure?: boolean;
}

const FamilyNode: React.FC<FamilyNodeProps> = ({ member, allFigures, isMainFigure = false }) => {
  const existingFigureProfile = member.figureId ? allFigures.find(f => f.id === member.figureId) : null;
  const photoToDisplay = member.photoUrl || existingFigureProfile?.photoUrl;
  const nameToDisplay = member.name || existingFigureProfile?.name || "Desconocido";
  const linkHref = existingFigureProfile ? `/figures/${existingFigureProfile.id}` : undefined;

  const nodeContent = (
    <div className={`flex flex-col items-center p-2 rounded-lg shadow-md w-28 min-h-[11rem] h-auto text-center transition-all duration-200 ease-in-out ${isMainFigure ? 'bg-primary/10 border-2 border-primary' : 'bg-card border'}`}>
      <div className="relative w-20 h-20 rounded-full overflow-hidden mb-1 border-2 border-muted bg-muted">
        {photoToDisplay ? (
          <Image 
            src={photoToDisplay} 
            alt={nameToDisplay} 
            fill 
            className="object-cover"
            data-ai-hint="portrait person" 
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" data-ai-hint="placeholder avatar">
            <UserCircle className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className={`font-semibold text-xs ${isMainFigure ? 'text-primary-foreground dark:text-primary' : 'text-foreground'}`}>{nameToDisplay}</p>
      <p className={`text-xs ${isMainFigure ? 'text-primary-foreground/80 dark:text-primary/90' : 'text-muted-foreground'}`}>{member.relationship}</p>
    </div>
  );

  if (linkHref) {
    return <Link href={linkHref} className="hover:scale-105 transform transition-transform">{nodeContent}</Link>;
  }
  return <div className="hover:scale-105 transform transition-transform cursor-default">{nodeContent}</div>;
};

const SimpleLine: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute bg-gray-300 dark:bg-gray-600 ${className}`} />
);

export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const familyMembers = figure.familyMembers || [];

  if (familyMembers.length === 0) {
    return <p className="text-muted-foreground text-center py-6">No hay información familiar disponible para {figure.name}.</p>;
  }

  // For now, just a placeholder if data exists. The actual tree rendering will be more complex.
  // return <p className="text-foreground text-center py-6">Visualización del árbol genealógico en desarrollo. Datos familiares presentes.</p>;

  // Basic rendering based on relationship (example - can be expanded)
  const getMember = (relationship: string): FamilyMember | undefined => 
    familyMembers.find(fm => fm.relationship.toLowerCase() === relationship.toLowerCase());

  // Define members for specific roles for layout
  const father = getMember("Padre");
  const mother = getMember("Madre");
  const paternalGrandfather = getMember("Abuelo paterno");
  const paternalGrandmother = getMember("Abuela paterna");
  const maternalGrandfather = getMember("Abuelo materno");
  const maternalGrandmother = getMember("Abuela materna");
  
  const siblings = familyMembers.filter(fm => fm.relationship.toLowerCase().includes("herman"));
  const children = familyMembers.filter(fm => fm.relationship.toLowerCase().includes("hijo") || fm.relationship.toLowerCase().includes("hija"));
  
  // Create a "self" node for the main figure
  const selfMember: FamilyMember = {
    id: figure.id, // Use figure's id as a unique key for this node
    name: figure.name,
    relationship: "Principal", // Or "Tú", "Protagonista", etc.
    figureId: figure.id,
    photoUrl: figure.photoUrl,
  };


  return (
    <div className="relative p-4 md:p-8 overflow-x-auto min-w-[700px]">
      <div className="flex flex-col items-center space-y-8">
        {/* Grandparents Row */}
        {(paternalGrandfather || paternalGrandmother || maternalGrandfather || maternalGrandmother) && (
          <div className="flex justify-center gap-8 md:gap-16 w-full">
            <div className="flex gap-4">
              {paternalGrandfather && <FamilyNode member={paternalGrandfather} allFigures={allFigures} />}
              {paternalGrandmother && <FamilyNode member={paternalGrandmother} allFigures={allFigures} />}
            </div>
            <div className="flex gap-4">
              {maternalGrandfather && <FamilyNode member={maternalGrandfather} allFigures={allFigures} />}
              {maternalGrandmother && <FamilyNode member={maternalGrandmother} allFigures={allFigures} />}
            </div>
          </div>
        )}

        {/* Parents Row */}
        {(father || mother) && (
          <div className="flex justify-center gap-8 md:gap-16 w-full">
            {father && <FamilyNode member={father} allFigures={allFigures} />}
            {mother && <FamilyNode member={mother} allFigures={allFigures} />}
          </div>
        )}

        {/* Main Figure and Siblings Row */}
        <div className="flex items-center justify-center gap-4 md:gap-8 w-full">
          {siblings.slice(0, Math.floor(siblings.length / 2)).map(sibling => ( // Siblings on left
            <FamilyNode key={sibling.id} member={sibling} allFigures={allFigures} />
          ))}
          <FamilyNode member={selfMember} allFigures={allFigures} isMainFigure />
          {siblings.slice(Math.floor(siblings.length / 2)).map(sibling => ( // Siblings on right
            <FamilyNode key={sibling.id} member={sibling} allFigures={allFigures} />
          ))}
        </div>

        {/* Children Row */}
        {children.length > 0 && (
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap w-full pt-4">
            {children.map(child => (
              <FamilyNode key={child.id} member={child} allFigures={allFigures} />
            ))}
          </div>
        )}
        {/* Basic Lines (Conceptual - needs actual SVG or more complex CSS for good lines) */}
        {/* This is a placeholder for where lines would go */}
      </div>
       <CardDescription className="text-center mt-8 text-xs">
        Nota: El árbol genealógico se basa en la información disponible. Las líneas de conexión son ilustrativas.
      </CardDescription>
    </div>
  );
};
