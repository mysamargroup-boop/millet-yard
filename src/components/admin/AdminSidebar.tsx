
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, LogOut, Megaphone, Send, PenSquare, ImageIcon, LayoutGrid, Settings, BookText, TicketPercent, Gift, ShoppingBag, ArrowRightLeft, Users, List, MessageSquare, Bell, HelpCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

const navItems = [
  { href: "/sr-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sr-admin/analytics/pl", label: "P&L Dashboard", icon: DollarSign },
  { href: "/sr-admin/analytics", label: "Analytics", icon: LayoutDashboard },
  { href: "/sr-admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/sr-admin/products", label: "Products", icon: Package },
  { href: "/sr-admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/sr-admin/blogs", label: "Blogs", icon: PenSquare },
  { href: "/sr-admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/sr-admin/questions", label: "Q&A", icon: HelpCircle },
  { href: "/sr-admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/sr-admin/banners", label: "Banners", icon: Megaphone },
  { href: "/sr-admin/site-images", label: "Site Images", icon: ImageIcon },
  { href: "/sr-admin/marketing", label: "Marketing", icon: Send },
  { href: "/sr-admin/leads", label: "Leads", icon: Users },
  { href: "/sr-admin/settings", label: "Settings", icon: Settings },
];

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'AD';
}

export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [ownerInfo, setOwnerInfo] = useState({ firstName: '', lastName: '' });

  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          setOwnerInfo({
            firstName: data?.owner_first_name || '',
            lastName: data?.owner_last_name || ''
          });
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);

  const NavContent = () => {
    return (
      <div className="flex h-full max-h-screen flex-col">
        {/* Profile Section */}
        <div className="p-5 flex items-center gap-3 border-b border-border/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#137fec] to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#137fec]/30">
            {getInitials(ownerInfo.firstName, ownerInfo.lastName)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-foreground text-base font-semibold">Admin Panel</h1>
            <p className="text-muted-foreground text-xs">Store Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto admin-scrollbar">
          <nav className="flex flex-col gap-0.5 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground transition-colors duration-150",
                    "hover:bg-accent hover:text-foreground",
                    isActive && "bg-[#137fec]/10 text-[#137fec] border-l-2 border-[#137fec] rounded-l-none"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive && "text-[#137fec]"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    isActive && "text-[#137fec] font-semibold"
                  )}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sign Out at Bottom - Highlighted */}
        <div className="p-4 border-t border-border/10">
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full justify-start gap-3 px-3 py-2.5 bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors border border-red-500/20 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </Button>
        </div>
      </div>
    )
  };

  return (
    <>
      {/* Desktop Sidebar - Fixed, independent scroll */}
      <div className="hidden lg:flex flex-col w-64 h-screen glass-panel fixed inset-y-0 left-0 z-20">
        <NavContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="flex flex-col p-0 w-64 glass-panel border-r-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
