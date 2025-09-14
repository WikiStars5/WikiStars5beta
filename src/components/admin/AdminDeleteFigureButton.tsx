
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { callFirebaseFunction } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

interface AdminDeleteFigureButtonProps {
    figureId: string;
    figureName: string;
}

export function AdminDeleteFigureButton({ figureId, figureName }: AdminDeleteFigureButtonProps) {
    const { isAdmin } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    if (!isAdmin) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await callFirebaseFunction('deleteFigure', { figureId });
            if (result.success) {
                toast({
                    title: "Figura Eliminada",
                    description: `El perfil de ${figureName} ha sido eliminado permanentemente.`,
                });
                router.push('/');
            } else {
                throw new Error(result.message || 'Error desconocido desde la función.');
            }
        } catch (error: any) {
            console.error("Error deleting figure:", error);
            toast({
                title: "Error al Eliminar",
                description: `No se pudo eliminar la figura. ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Estás a punto de eliminar permanentemente el perfil de **{figureName}**. Esta acción borrará la figura y todos sus datos asociados (comentarios, votos, etc.).
                        <br/><br/>
                        **Esta acción no se puede deshacer.** ¿Estás seguro de que quieres continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
