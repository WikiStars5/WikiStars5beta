
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
import { timeSince } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useCommentThread } from '@/hooks/use-comment-thread';

export function NotificationBell() {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { openCommentThread } = useCommentThread();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = React.useState(false);

  const storageKey = React.useMemo(() => 
    firebaseUser ? `wikistars5-notifications-${firebaseUser.uid}` : '', 
  [firebaseUser]);

  React.useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Notification[];
        setNotifications(parsed);
        setHasUnread(parsed.some(n => !n.isRead));
      } catch (e) {
        console.error("Error parsing notifications from storage:", e);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  React.useEffect(() => {
    const handleUpdate = () => {
      if (!storageKey) return;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Notification[];
          setNotifications(parsed);
          setHasUnread(parsed.some(n => !n.isRead));
        } catch (e) {
            console.error("Error parsing notifications from storage on update:", e);
        }
      }
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, [storageKey]);

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!storageKey || notifications.length === 0) return;
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNotifications(updated);
    setHasUnread(false);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!storageKey) return;
    localStorage.removeItem(storageKey);
    setNotifications([]);
    setHasUnread(false);
  };
  
  const handleNotificationClick = (notif: Notification, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Mark as read
    const updatedNotifications = notifications.map(n => 
        n.id === notif.id ? { ...n, isRead: true } : n
    );
    setNotifications(updatedNotifications);
    setHasUnread(updatedNotifications.some(n => !n.isRead));
    localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));

    // Open the dialog
    openCommentThread(`figures/${notif.figureId}/comments/${notif.commentId}`, notif.replyId ?? null);
  };

  const uniqueNotifications = React.useMemo(() => {
    const seen = new Set();
    return notifications.filter(notif => {
      const duplicate = seen.has(notif.id);
      seen.add(notif.id);
      return !duplicate;
    });
  }, [notifications]);


  if (isAuthLoading || !firebaseUser) {
    return null;
  }

  return (
    <DropdownMenu>
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
          {hasUnread && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={handleMarkAllAsRead}>
              Marcar como leído
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {uniqueNotifications.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No tienes notificaciones.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {uniqueNotifications.map((notif) => (
              <DropdownMenuItem key={notif.id} onSelect={(e) => e.preventDefault()} asChild className="p-0">
                <button
                  onClick={(e) => handleNotificationClick(notif, e)}
                  className="w-full flex items-start gap-3 py-2 px-3 cursor-pointer text-left hover:bg-accent"
                >
                    <div className="pt-1.5">
                       {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div className="flex-grow">
                        <p className={cn("text-sm", !notif.isRead && "font-semibold")}>
                            <span className="font-bold">{notif.replierName}</span> respondió a tu comentario en <span className="font-bold">{notif.figureName}</span>.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {timeSince(new Date(notif.createdAt))}
                        </p>
                    </div>
                </button>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {uniqueNotifications.length > 0 && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleClearAll} className="flex justify-center text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Borrar Todo
                </DropdownMenuItem>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
