
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, CheckCheck } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

function timeSince(date: Date): string {
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

export function NotificationBell() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // We only care about registered users for notifications
      if (user && !user.isAnonymous) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications: Notification[] = [];
      let newUnreadCount = 0;
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() } as Notification;
        fetchedNotifications.push(data);
        if (!data.isRead) {
          newUnreadCount++;
        }
      });
      setNotifications(fetchedNotifications);
      setUnreadCount(newUnreadCount);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    // Navigate to the figure's page with a hash to identify the comment.
    router.push(`/figures/${notification.figureId}#comment-${notification.commentId}`);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    await markAllNotificationsAsRead(currentUser.uid);
  };
  
  if (!currentUser) {
    return null; // Don't show the bell if not logged in
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-foreground/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold text-sm px-2">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              <CheckCheck className="mr-1 h-3 w-3"/>
              Marcar como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map(notification => (
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
                    <p>
                      <span className="font-semibold">{notification.actorName}</span>
                      {' '}ha respondido a tu comentario sobre{' '}
                      <span className="font-semibold">{notification.figureName}</span>.
                    </p>
                     <p className="text-xs text-muted-foreground mt-1">
                      {timeSince(notification.createdAt.toDate())}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1" title="No leído"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground p-8">No tienes notificaciones.</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
