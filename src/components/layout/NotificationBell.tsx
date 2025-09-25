
"use client";

import * as React from 'react';
import { Bell, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { timeSince } from '@/lib/utils';
import Link from 'next/link';

export function NotificationBell() {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = React.useState(false);

  const storageKey = React.useMemo(() => 
    firebaseUser ? `wikistars5-notifications-${firebaseUser.uid}` : '', 
  [firebaseUser]);

  // Load notifications from local storage on mount
  React.useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Notification[];
      setNotifications(parsed);
      setHasUnread(parsed.some(n => !n.isRead));
    }
  }, [storageKey]);

  // Listen for custom event to update notifications in real-time across components
  React.useEffect(() => {
    const handleUpdate = () => {
      if (!storageKey) return;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        setNotifications(parsed);
        setHasUnread(parsed.some(n => !n.isRead));
      }
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, [storageKey]);


  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storageKey) return;
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(updated);
    setHasUnread(false);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storageKey) return;
    localStorage.removeItem(storageKey);
    setNotifications([]);
    setHasUnread(false);
  };

  if (isAuthLoading || !firebaseUser) {
    return null;
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if(open) setHasUnread(false) }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notificaciones
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={handleMarkAllAsRead}>
              Marcar como leído
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No tienes notificaciones.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} asChild>
                <Link
                  href={`/figures/${notif.figureId}?comment=${notif.commentId}#comment-${notif.commentId}`}
                  className="flex items-start gap-3 py-2 px-3 cursor-pointer"
                >
                    {!notif.isRead && <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="text-sm">
                            <span className="font-semibold">{notif.replierName}</span> respondió a tu comentario en <span className="font-semibold">{notif.figureName}</span>.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {timeSince(new Date(notif.createdAt))}
                        </p>
                    </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {notifications.length > 0 && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearAll} className="flex justify-center text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Borrar Todo
                </DropdownMenuItem>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
