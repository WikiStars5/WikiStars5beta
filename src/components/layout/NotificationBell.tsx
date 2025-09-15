
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Bell, Check, MessageSquare, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { correctMalformedUrl } from '@/lib/utils';

function timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "justo ahora";
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} min`;
    return `hace ${Math.floor(seconds)} seg`;
}

const NOTIFICATION_ICONS: Record<Notification['type'], React.ElementType> = {
    'like': ThumbsUp,
    'dislike': ThumbsDown,
    'reply': MessageSquare,
    'system': Bell
};

const NOTIFICATION_COLORS: Record<Notification['type'], string> = {
    'like': 'text-blue-500',
    'dislike': 'text-red-500',
    'reply': 'text-green-500',
    'system': 'text-primary'
};


export function NotificationBell() {
  const { firebaseUser, isAnonymous } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser || isAnonymous) {
        setNotifications([]);
        setUnreadCount(0);
        return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', firebaseUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      const newNotifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data() as Notification;
        if (!data.isRead) {
          count++;
        }
        return { id: doc.id, ...data };
      });
      setNotifications(newNotifications);
      setUnreadCount(count);
    }, (error) => {
        console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [firebaseUser, isAnonymous]);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (!result.success) {
      toast({
        title: "Error",
        description: result.message || "No se pudo marcar como leído.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!firebaseUser || unreadCount === 0) return;
    const result = await markAllNotificationsAsRead(firebaseUser.uid);
    if (!result.success) {
        toast({
            title: "Error",
            description: result.message || "No se pudieron marcar todas como leídas.",
            variant: "destructive"
        });
    }
  };

  if (!firebaseUser || isAnonymous) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-1 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notificaciones</span>
            {unreadCount > 0 && (
                 <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                    Marcar todo como leído
                 </Button>
            )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
            <DropdownMenuGroup>
            {notifications.length === 0 ? (
                <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones.</p>
            ) : (
                notifications.map((notif) => {
                    const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                    const iconColor = NOTIFICATION_COLORS[notif.type] || 'text-primary';
                    const linkHref = `/figures/${notif.figureId}?comment=${notif.replyId || notif.commentId}#comment-${notif.replyId || notif.commentId}`;
                    return (
                    <DropdownMenuItem 
                        key={notif.id} 
                        asChild 
                        className={cn("p-0 data-[highlighted]:bg-primary/10", !notif.isRead && "bg-muted/50 font-semibold")}
                    >
                       <Link 
                            href={linkHref}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="block w-full p-2 cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={correctMalformedUrl(notif.actorPhotoUrl)} alt={notif.actorName}/>
                                        <AvatarFallback>{notif.actorName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                     <div className={cn("absolute -bottom-1 -right-1 rounded-full p-1 bg-card", iconColor)}>
                                        <Icon className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm">
                                        <span className="font-bold">{notif.actorName}</span>
                                        {
                                            notif.type === 'like' ? ' le dio "me gusta" a tu comentario sobre ' :
                                            notif.type === 'dislike' ? ' le dio "no me gusta" a tu comentario sobre ' :
                                            notif.type === 'reply' ? ' respondió a tu comentario sobre ' :
                                            ' '
                                        }
                                        <span className="font-bold">{notif.figureName}</span>.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {timeSince(notif.createdAt.toDate())}
                                    </p>
                                </div>
                                {!notif.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 self-center flex-shrink-0"></div>}
                            </div>
                        </Link>
                    </DropdownMenuItem>
                    )
                })
            )}
            </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
