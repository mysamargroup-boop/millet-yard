
"use client";

import { Button } from "@/components/ui/button";
import { UserCircle, PanelLeft, LogOut, Search } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import { useAuth } from "@/lib/auth";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminHeader({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [ownerName, setOwnerName] = useState("Admin");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/site-settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data?.owner_first_name) {
                        setOwnerName(`${data.owner_first_name} ${data.owner_last_name || ''}`.trim());
                    }
                }
            } catch (e) {
                console.error("Failed to fetch settings for header", e);
            }
        };
        fetchSettings();
    }, []);

    return (
        <header className="h-16 flex items-center justify-between gap-4 px-6 py-3 glass-panel border-b border-border/50 dark:border-white/5 flex-shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 lg:hidden hover:bg-white/10"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
                <h1 className="font-bold text-xl tracking-tight text-foreground hidden sm:block">
                    Admin Console
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="glass-input pl-10 pr-4 py-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-48 lg:w-64"
                    />
                </div>

                {/* Notifications */}
                <NotificationDropdown />

                {/* Theme Toggle */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="h-9 w-9 bg-gradient-to-br from-white/80 to-white/40 text-black backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/90 transition-all duration-300 rounded-full dark:from-gray-800 dark:to-gray-900 dark:text-white dark:border-gray-700"
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 gap-3 rounded-full hover:bg-white/10 px-2">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-sm font-semibold text-[#137fec]">{ownerName}</span>
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 glass-panel" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{ownerName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()} className="text-red-500 cursor-pointer hover:bg-red-500/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
