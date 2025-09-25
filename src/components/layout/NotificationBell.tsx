

"use client";

import * as React from 'react';
import { Bell, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';

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
  reply: MessageSquare,
  like: ThumbsUp,
  dislike: ThumbsDown,
};

const NOTIFICATION_COLORS: Record<Notification['type'], string> = {
  reply: 'text-blue-500',
  like: 'text-green-500',
  dislike: 'text-red-500',
};

export function NotificationBell() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [hasPlayedSound, setHasPlayedSound] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fnotificacion.mp3?alt=media&token=488cfa9f-93d3-4659-bb4f-8a03c27e02e1");
    }
  }, []);

  React.useEffect(() => {
    if (!firebaseUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    const notifsRef = collection(db, `users/${firebaseUser.uid}/notifications`);
    const q = query(notifsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        const newUnreadCount = newNotifications.filter(n => !n.isRead).length;

        // Play sound only if a new unread notification has arrived
        if (newUnreadCount > unreadCount && hasPlayedSound) {
             audioRef.current?.play().catch(e => console.error("Error playing notification sound:", e));
        }
        
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);

        // Allow sound to be played on subsequent notifications
        if (!hasPlayedSound) {
            setHasPlayedSound(true);
        }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const markAllAsRead = async () => {
    if (!firebaseUser || notifications.length === 0) return;

    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifs.forEach(notif => {
      const notifRef = doc(db, `users/${firebaseUser.uid}/notifications`, notif.id);
      batch.update(notifRef, { isRead: true });
    });
    await batch.commit();
  };
  
  const getGroupedNotifications = () => {
    const groups: { [key: string]: Notification[] } = {
      reply: [],
      like: [],
      dislike: [],
    };
    notifications.forEach(n => {
      if (groups[n.type]) {
        groups[n.type].push(n);
      }
    });
    return groups;
  }

  const groupedNotifications = getGroupedNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-primary-foreground text-xs items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
            Notificaciones
            {unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>Marcar todo como leído</Button>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No tienes notificaciones</DropdownMenuItem>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedNotifications).map(([type, notifs]) => {
              if (notifs.length === 0) return null;
              const Icon = NOTIFICATION_ICONS[type as Notification['type']];
              const color = NOTIFICATION_COLORS[type as Notification['type']];
              
              let title = "";
              if (type === 'reply') title = "Respuestas";
              if (type === 'like') title = "Me gusta";
              if (type === 'dislike') title = "No me gusta";

              return (
                <React.Fragment key={type}>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">{title}</DropdownMenuLabel>
                  {notifs.map(n => (
                    <DropdownMenuItem key={n.id} asChild>
                      <Link href={`/figures/${n.figureId}?comment=${n.commentId}#comment-${n.commentId}`} className="flex items-start gap-3 !p-3">
                         <Icon className={`${color} h-5 w-5 mt-1 flex-shrink-0`} />
                        <div className="flex-grow">
                          <p className="text-sm leading-snug">
                            <span className="font-semibold">{n.actorName}</span>{' '}
                            {type === 'reply' ? 'respondió a tu comentario en el perfil de' : type === 'like' ? 'le gustó tu comentario en el perfil de' : 'reaccionó a tu comentario en el perfil de'}
                            {' '}<span className="font-semibold">{n.figureName}</span>.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">"{n.commentText}"</p>
                          <p className="text-xs text-muted-foreground mt-1">{timeSince(n.createdAt.toDate())}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
