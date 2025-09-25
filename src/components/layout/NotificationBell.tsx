
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Bell, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { collection, query, where, onSnapshot, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { correctMalformedUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function timeSince(date: Date): string {
    if (!date || isNaN(date.getTime())) return "";

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


const NOTIFICATION_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Flivechat.mp3?alt=media&token=e24b4376-3067-4953-91cc-7076d9df9711";


export function NotificationBell() {
    const { currentUser, isAnonymous, isLoading: isAuthLoading } = useAuth();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const { toast } = useToast();
    
    const seenNotificationIds = React.useRef(new Set<string>());

    React.useEffect(() => {
        if (isAuthLoading) {
            setIsLoading(true);
            return;
        }

        if (isAnonymous || !currentUser) {
            // For now, anonymous users have no notifications.
            // This section can be expanded later to use localStorage.
            setIsLoading(false);
            setNotifications([]);
            return;
        }

        setIsLoading(true);
        const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
        const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications: Notification[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const notification = {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
                } as Notification;
                fetchedNotifications.push(notification);
            });

            const newUnseenNotifications = fetchedNotifications.filter(
                n => !n.read && !seenNotificationIds.current.has(n.id!)
            );

            if (isMenuOpen === false && newUnseenNotifications.length > 0 && document.hasFocus()) {
                const audio = new Audio(NOTIFICATION_SOUND_URL);
                audio.play().catch(e => console.error("Error playing notification sound:", e));
            }

            if (newUnseenNotifications.length > 0) {
              newUnseenNotifications.forEach(n => seenNotificationIds.current.add(n.id!));
            }

            setNotifications(fetchedNotifications);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setIsLoading(false);
        });
        
        return () => unsubscribe();
        
    }, [currentUser, isAnonymous, isAuthLoading, isMenuOpen]);
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const markAsRead = async () => {
        if (unreadCount === 0 || !currentUser) return;

        const batch = writeBatch(db);
        notifications.forEach(notification => {
             if (!notification.read && notification.id) {
                const notifRef = doc(db, `users/${currentUser.uid}/notifications`, notification.id);
                batch.update(notifRef, { read: true });
            }
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        setIsMenuOpen(open);
        if (open && unreadCount > 0) {
            markAsRead();
        }
    }

    if (isAuthLoading) {
      return (
        <Button variant="ghost" size="icon" className="relative text-foreground/70" disabled>
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
      )
    }

    return (
        <DropdownMenu open={isMenuOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && !isAnonymous && (
                        <span className="absolute top-1 right-1.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {isLoading ? (
                        <div className="flex justify-center items-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones.</p>
                    ) : (
                        notifications.map((notif) => (
                           <DropdownMenuItem key={notif.id} asChild className="cursor-pointer">
                             <Link href={`/figures/${notif.figureId}?comment=${notif.commentId}#comment-${notif.replyId}`}>
                               <div className="flex items-start gap-3 w-full">
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={correctMalformedUrl(notif.fromUserAvatar)} />
                                        <AvatarFallback>{notif.fromUserName?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="text-sm">
                                            <strong>{notif.fromUserName}</strong> respondió a tu comentario en <strong>{notif.figureName}</strong>.
                                        </p>
                                        <p className="text-xs text-muted-foreground">{timeSince(notif.createdAt)}</p>
                                    </div>
                                    {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0"></div>}
                               </div>
                            </Link>
                           </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

    