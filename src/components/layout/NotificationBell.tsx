

"use client";

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, ThumbsUp, ThumbsDown, MessageSquareReply, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, writeBatch, getDocs, doc, limit } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { correctMalformedUrl, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const NOTIFICATION_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Flivechat.mp3?alt=media&token=e24b4376-3067-4953-91cc-7076d9df9711";


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
    reply: MessageSquareReply,
    like: ThumbsUp,
    dislike: ThumbsDown,
};

const getNotificationText = (notification: Notification): React.ReactNode => {
    const fromUser = <span className="font-semibold">{notification.fromUserName}</span>;
    const figureName = <span className="font-semibold">{notification.figureName}</span>;
    
    switch (notification.type) {
        case 'reply':
            return <>{fromUser} ha respondido a tu comentario en el perfil de {figureName}.</>;
        case 'like':
            return <>{fromUser} ha reaccionado con "Me gusta" a tu comentario en el perfil de {figureName}.</>;
        case 'dislike':
            return <>{fromUser} ha reaccionado con "No me gusta" a tu comentario en el perfil de {figureName}.</>;
        default:
            return "Nueva notificación.";
    }
};


export function NotificationBell() {
    const { firebaseUser } = useAuth();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const initialLoadDone = React.useRef(false);

    React.useEffect(() => {
        if (typeof Audio !== "undefined") {
            audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
            audioRef.current.preload = 'auto';
        }
    }, []);

    React.useEffect(() => {
        if (!firebaseUser) {
            setIsLoading(false);
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setIsLoading(true);
        const notificationsRef = collection(db, `users/${firebaseUser.uid}/notifications`);
        const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications: Notification[] = [];
            let newUnreadCount = 0;
            
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" && initialLoadDone.current) {
                     if (audioRef.current) {
                        audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
                     }
                }
            });

            snapshot.forEach(doc => {
                const data = doc.data();
                const notification: Notification = {
                    id: doc.id,
                    ...data,
                } as Notification;
                newNotifications.push(notification);
                if (!notification.read) {
                    newUnreadCount++;
                }
            });

            setNotifications(newNotifications);
            setUnreadCount(newUnreadCount);
            setIsLoading(false);
            initialLoadDone.current = true;
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
            initialLoadDone.current = false;
        }
    }, [firebaseUser]);

    const handleOpenChange = async (open: boolean) => {
        if (open && unreadCount > 0 && firebaseUser) {
            const batch = writeBatch(db);
            const unreadNotifs = notifications.filter(n => !n.read);
            unreadNotifs.forEach(n => {
                const notifRef = doc(db, `users/${firebaseUser.uid}/notifications`, n.id);
                batch.update(notifRef, { read: true });
            });
            await batch.commit();
        }
    };
    
    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                     <div className="flex justify-center items-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground p-4">No tienes notificaciones.</p>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notif => {
                             const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                             const iconColor = notif.type === 'like' ? 'text-blue-500' : notif.type === 'dislike' ? 'text-red-500' : 'text-muted-foreground';
                             return (
                                <DropdownMenuItem key={notif.id} asChild>
                                    <Link
                                        href={`/figures/${notif.figureId}?comment=${notif.commentId}#comment-${notif.replyId || notif.commentId}`}
                                        className="flex items-start gap-3 p-2 cursor-pointer w-full text-left"
                                    >
                                        <div className="relative mt-1">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={correctMalformedUrl(notif.fromUserAvatar)} alt={notif.fromUserName} />
                                                <AvatarFallback>{notif.fromUserName?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                             <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                                                <Icon className={cn("h-4 w-4", iconColor)} />
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm">
                                               {getNotificationText(notif)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {notif.createdAt && timeSince(notif.createdAt.toDate())}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                        )}
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
