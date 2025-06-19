
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

// Internal component to render each family member node
interface FamilyNodeProps {
  member: FamilyMember; // Accepts the FamilyMember type, which includes id, name, relationship, figureId, photoUrl
  allFigures: Figure[]; // To find linked profiles
  isMainFigure?: boolean; // To style the main figure differently
}

const FamilyNode: React.FC<FamilyNodeProps> = ({ member, allFigures, isMainFigure = false }) => {
  // Try to find an existing profile for this family member if figureId is provided
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
            sizes="80px" // Provide a reasonable size for the avatar
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


export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  // Create a FamilyMember object for the main figure
  const selfMember: FamilyMember = {
    id: figure.id, // Use figure's id as a unique key for this node
    name: figure.name,
    relationship: "Principal", 
    figureId: figure.id, // Link to self
    photoUrl: figure.photoUrl,
  };

  const familyMembers = figure.familyMembers || [];

  // Specific roles for layout
  const father = familyMembers.find(fm => fm.relationship.toLowerCase() === "padre");
  const mother = familyMembers.find(fm => fm.relationship.toLowerCase() === "madre");
  const paternalGrandfather = familyMembers.find(fm => fm.relationship.toLowerCase() === "abuelo paterno");
  const paternalGrandmother = familyMembers.find(fm => fm.relationship.toLowerCase() === "abuela paterna");
  const maternalGrandfather = familyMembers.find(fm => fm.relationship.toLowerCase() === "abuelo materno");
  const maternalGrandmother = familyMembers.find(fm => fm.relationship.toLowerCase() === "abuela materna");
  
  const siblings = familyMembers.filter(fm => fm.relationship.toLowerCase().includes("herman")); // Catches Hermano, Hermana
  const children = familyMembers.filter(fm => fm.relationship.toLowerCase().includes("hijo") || fm.relationship.toLowerCase().includes("hija"));
  const partner = familyMembers.find(fm => ["esposo", "esposa", "pareja", "novio", "novia"].includes(fm.relationship.toLowerCase()));

  // Determine if there's any family data at all, besides the main figure itself
  const hasAnyActualFamilyData = familyMembers.length > 0;


  return (
    <div className="relative p-4 md:p-8 overflow-x-auto min-w-[700px]">
      <div className="flex flex-col items-center space-y-8">
        {/* Grandparents Row */}
        {(paternalGrandfather || paternalGrandmother || maternalGrandfather || maternalGrandmother) && (
          <div className="flex justify-center gap-8 md:gap-16 w-full">
            {/* Paternal Grandparents */}
            <div className="flex gap-4">
              {paternalGrandfather && <FamilyNode member={paternalGrandfather} allFigures={allFigures} />}
              {paternalGrandmother && <FamilyNode member={paternalGrandmother} allFigures={allFigures} />}
            </div>
            {/* Maternal Grandparents */}
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

        {/* Main Figure, Siblings, and Partner Row */}
        <div className="flex items-center justify-center gap-4 md:gap-8 w-full">
          {siblings.slice(0, Math.floor(siblings.length / 2)).map(sibling => (
            <FamilyNode key={sibling.id} member={sibling} allFigures={allFigures} />
          ))}
          <FamilyNode member={selfMember} allFigures={allFigures} isMainFigure />
          {partner && <FamilyNode member={partner} allFigures={allFigures} />}
          {siblings.slice(Math.floor(siblings.length / 2)).map(sibling => (
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
        
        {!hasAnyActualFamilyData && (
           <p className="text-muted-foreground text-center py-6">No hay información familiar disponible para {figure.name}.</p>
        )}
      </div>
       <CardDescription className="text-center mt-8 text-xs">
        Nota: El árbol genealógico se basa en la información disponible. Las líneas de conexión son ilustrativas.
      </CardDescription>
    </div>
  );
};

