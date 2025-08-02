
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { GuestNotification } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, CheckCheck, MessageSquareReply, Heart, User } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function timeSince(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "a";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
}

export function GuestNotificationBell() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = React.useState<GuestNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const getStorageKey = React.useCallback(() => {
    return firebaseUser ? `wikistars5-guest-notifications-${firebaseUser.uid}` : null;
  }, [firebaseUser]);

  React.useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    // Load initial notifications from localStorage
    const storedNotificationsJSON = localStorage.getItem(storageKey);
    const storedNotifications: GuestNotification[] = storedNotificationsJSON ? JSON.parse(storedNotificationsJSON) : [];
    setNotifications(storedNotifications);
    setUnreadCount(storedNotifications.filter(n => !n.isRead).length);
    
    // Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const newNotifications: GuestNotification[] = event.newValue ? JSON.parse(event.newValue) : [];
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.isRead).length);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [getStorageKey]);

  const handleNotificationClick = (notification: GuestNotification) => {
    const url = `/figures/${notification.figureId}#comment-${notification.replyId || notification.commentId}`;
    router.push(url);
    setIsOpen(false);

    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const markAsRead = (notificationId: string) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    const newNotifications = notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    localStorage.setItem(storageKey, JSON.stringify(newNotifications));
  };
  
  const handleMarkAllAsRead = () => {
    const storageKey = getStorageKey();
    if (!storageKey || unreadCount === 0) return;

    const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(newNotifications);
    setUnreadCount(0);
    localStorage.setItem(storageKey, JSON.stringify(newNotifications));
  };
  
  if (!firebaseUser || !firebaseUser.isAnonymous) {
    return null;
  }

  const replyNotifications = notifications.filter(n => n.type === 'reply');
  const likeNotifications = notifications.filter(n => n.type === 'like');

  const renderNotificationItem = (notification: GuestNotification) => (
    <div
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50",
        !notification.isRead && "bg-primary/5"
      )}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={correctMalformedUrl(notification.actorPhotoUrl) || undefined} alt={notification.actorName} />
        <AvatarFallback>{notification.actorName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-sm flex-1">
        {notification.type === 'reply' ? (
          <p>
            <span className="font-semibold">{notification.actorName}</span>
            {' '}ha respondido a tu comentario sobre{' '}
            <span className="font-semibold">{notification.figureName}</span>.
          </p>
        ) : (
          <p>
            <span className="font-semibold">{notification.actorName}</span>
            {' '}le ha dado me gusta a tu comentario sobre{' '}
            <span className="font-semibold">{notification.figureName}</span>.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {timeSince(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary mt-1" title="No leído"></div>
      )}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-foreground/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold text-sm px-2">Notificaciones Locales</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              <CheckCheck className="mr-1 h-3 w-3"/>
              Marcar como leídas
            </Button>
          )}
        </div>
        <Tabs defaultValue="replies" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-0 rounded-none border-b">
                <TabsTrigger value="replies" className="py-2 rounded-none text-xs"><MessageSquareReply className="mr-2 h-4 w-4"/>Respuestas</TabsTrigger>
                <TabsTrigger value="likes" className="py-2 rounded-none text-xs"><Heart className="mr-2 h-4 w-4"/>Me gusta</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[400px]">
                <TabsContent value="replies">
                    {replyNotifications.length > 0 ? (
                        <div className="divide-y">
                            {replyNotifications.map(renderNotificationItem)}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground p-8">No tienes respuestas nuevas.</p>
                    )}
                </TabsContent>
                <TabsContent value="likes">
                    {likeNotifications.length > 0 ? (
                        <div className="divide-y">
                            {likeNotifications.map(renderNotificationItem)}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-muted-foreground p-8">Nadie le ha dado 'me gusta' a tus comentarios aún.</p>
                    )}
                </TabsContent>
            </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
