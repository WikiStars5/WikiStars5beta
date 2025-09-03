
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
import { Bell, CheckCheck, MessageSquareReply, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


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
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // We only care about registered users for this component
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
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const serverNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(serverNotifications);
      setUnreadCount(serverNotifications.filter(n => !n.isRead).length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);


  const handleNotificationClick = async (notification: Notification) => {
    // Navigate immediately for the best user experience.
    // Use replyId for reply notifications, and commentId for like notifications.
    const commentIdForUrl = notification.replyId || notification.commentId;
    const url = `/figures/${notification.figureId}#comment-${commentIdForUrl}`;
    router.push(url);
    setIsOpen(false);

    // Mark as read in the background.
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser || unreadCount === 0) return;

    const originalNotifications = [...notifications];
    const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(newNotifications);
    setUnreadCount(0);

    markAllNotificationsAsRead(currentUser.uid).then(result => {
        if (!result.success) {
          toast({ title: "Error", description: result.message || "No se pudieron marcar todas las notificaciones como leídas.", variant: "destructive" });
          setNotifications(originalNotifications);
          setUnreadCount(originalNotifications.filter(n => !n.isRead).length);
        }
    });
  };
  
  if (!currentUser) {
    return null;
  }

  const replyNotifications = notifications.filter(n => n.type === 'reply');
  const likeNotifications = notifications.filter(n => n.type === 'like');
  const dislikeNotifications = notifications.filter(n => n.type === 'dislike');


  const renderNotificationItem = (notification: Notification) => (
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
        ) : notification.type === 'like' ? (
          <p>
            <span className="font-semibold">{notification.actorName}</span>
            {' '}le ha dado me gusta a tu comentario sobre{' '}
            <span className="font-semibold">{notification.figureName}</span>.
          </p>
        ) : (
           <p>
            <span className="font-semibold">{notification.actorName}</span>
            {' '}no está de acuerdo con tu comentario sobre{' '}
            <span className="font-semibold">{notification.figureName}</span>.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {notification.createdAt ? timeSince(notification.createdAt.toDate()) : ''}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary mt-1" title="No leído"></div>
      )}
    </div>
  );

  const renderNotificationList = (list: Notification[], emptyMessage: string) => (
      list.length > 0 ? (
          <div className="divide-y">
              {list.map(renderNotificationItem)}
          </div>
      ) : (
          <p className="text-center text-sm text-muted-foreground p-8">{emptyMessage}</p>
      )
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
          <h3 className="font-semibold text-sm px-2">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              <CheckCheck className="mr-1 h-3 w-3"/>
              Marcar como leídas
            </Button>
          )}
        </div>
        <TooltipProvider>
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-0 rounded-none border-b">
                    <TabsTrigger value="all" className="py-2 rounded-none text-xs"><Bell className="mr-2 h-4 w-4"/>Todo</TabsTrigger>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="replies" className="py-2 rounded-none text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><MessageSquareReply className="h-4 w-4"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Respuestas</p></TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="likes" className="py-2 rounded-none text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ThumbsUp className="h-4 w-4"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Me gusta</p></TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="dislikes" className="py-2 rounded-none text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ThumbsDown className="h-4 w-4"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>No me gusta</p></TooltipContent>
                    </Tooltip>
                </TabsList>
                <ScrollArea className="h-[400px]">
                    <TabsContent value="all">
                        {renderNotificationList(notifications, "No tienes notificaciones.")}
                    </TabsContent>
                    <TabsContent value="replies">
                        {renderNotificationList(replyNotifications, "No tienes respuestas nuevas.")}
                    </TabsContent>
                    <TabsContent value="likes">
                        {renderNotificationList(likeNotifications, "Nadie le ha dado 'me gusta' a tus comentarios aún.")}
                    </TabsContent>
                    <TabsContent value="dislikes">
                        {renderNotificationList(dislikeNotifications, "Nadie ha marcado 'no me gusta' en tus comentarios.")}
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}
