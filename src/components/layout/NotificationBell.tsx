
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
  
  const [notificationSound, setNotificationSound] = React.useState<HTMLAudioElement | null>(null);
  const prevUnreadCountRef = React.useRef(0);
  const isInitialLoadRef = React.useRef(true);
  
  React.useEffect(() => {
    const sound = new Audio("https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Flivechat.mp3?alt=media&token=e24b4376-3067-4953-91cc-7076d9df9711");
    sound.preload = 'auto';
    setNotificationSound(sound);
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
      // Get raw data from the server for sound logic
      const serverUnreadCount = snapshot.docs.filter(doc => !doc.data().isRead).length;

      // Update state using a callback to get the latest state and avoid dependency loops
      setNotifications(prevLocalNotifications => {
        // Create a map of the previous optimistic `isRead` states for quick lookup
        const localReadState = new Map(prevLocalNotifications.map(n => [n.id, n.isRead]));
        
        // Map the new server data
        const serverNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        
        // Merge server data with local optimistic updates
        const mergedNotifications = serverNotifications.map(serverN => {
          if (localReadState.get(serverN.id) === true && !serverN.isRead) {
            return { ...serverN, isRead: true }; // Preserve optimistic read
          }
          return serverN;
        });

        // Update the visual unread count based on the final merged list
        const finalUnreadCount = mergedNotifications.filter(n => !n.isRead).length;
        setUnreadCount(finalUnreadCount);
        
        return mergedNotifications;
      });

      // Handle sound effect logic using server data to prevent playing on optimistic updates
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      } else if (serverUnreadCount > prevUnreadCountRef.current) {
        notificationSound?.play().catch(err => console.error("Audio play failed:", err));
      }
      prevUnreadCountRef.current = serverUnreadCount;

    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => {
      unsubscribe();
      isInitialLoadRef.current = true;
      prevUnreadCountRef.current = 0;
    };
  }, [currentUser, notificationSound]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      markNotificationAsRead(notification.id).catch(err => {
        console.error("Failed to mark notification as read on server:", err);
      });
    }

    const targetId = notification.replyId || notification.commentId;
    router.push(`/figures/${notification.figureId}#comment-${targetId}`);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser || unreadCount === 0) return;

    setNotifications(prev => prev.map(n => n.isRead ? n : { ...n, isRead: true }));
    setUnreadCount(0);

    markAllNotificationsAsRead(currentUser.uid).catch(err => {
      console.error("Failed to mark all as read on server:", err);
    });
  };
  
  if (!currentUser) {
    return null;
  }

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
                      {notification.createdAt ? timeSince(notification.createdAt.toDate()) : ''}
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
