"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markNotificationAsRead } from "@/lib/actions";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link?: string;
    created_at: string;
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-white/10">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[calc(100vw-2rem)] max-w-[380px] sm:w-80 glass-panel border-white/10 mx-auto sm:mx-0"
                align="end"
                alignOffset={0}
                sideOffset={8}
                forceMount
                style={{
                    /* Mobile centering: override transform on small screens */
                    position: 'fixed',
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            >
                <style>{`
                    @media (min-width: 640px) {
                        [data-radix-popper-content-wrapper] {
                            position: absolute !important;
                            left: auto !important;
                            transform: none !important;
                        }
                    }
                `}</style>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">Notifications</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            You have {unreadCount} unread messages
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-6 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group relative",
                                        !n.is_read && "bg-blue-500/5"
                                    )}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <p className={cn("text-sm", !n.is_read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <Link
                                                    href={n.link}
                                                    className="text-[10px] text-primary hover:underline mt-2 inline-block"
                                                    onClick={() => handleMarkAsRead(n.id)}
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                        {!n.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(n.id)}
                                                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/50 mt-2">
                                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
