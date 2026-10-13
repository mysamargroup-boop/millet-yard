
'use client';

import { Suspense, useEffect, useState } from 'react';
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider, useTheme } from 'next-themes';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { usePathname, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminFooter from '@/components/admin/AdminFooter';

function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoginRoute = pathname === "/sr-admin/login";

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && !isLoginRoute) {
      router.push("/sr-admin/login");
    } else if (user && isLoginRoute) {
      router.push("/sr-admin/dashboard");
    }

  }, [user, loading, router, isLoginRoute, pathname]);

  if (loading || (!user && !isLoginRoute)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (user) {
    return (
      <div className="flex h-screen overflow-hidden bg-background admin-bg admin-gradient-bg">
        {/* Gradient Background Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#137fec]/20 blur-[120px]" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px]" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        </div>

        {/* Sidebar - fixed, scrollable independently */}
        <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 flex flex-col overflow-hidden lg:pl-64 relative z-10">
          <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto admin-scrollbar flex flex-col">
            <div className="flex-1">
              <Suspense
                fallback={
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-2 w-full md:w-auto">
                        <div className="h-7 w-40 bg-muted/60 dark:bg-muted/40 rounded-lg animate-pulse" />
                        <div className="h-4 w-64 bg-muted/40 dark:bg-muted/30 rounded-md animate-pulse" />
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                        <div className="h-9 w-24 bg-muted/40 dark:bg-muted/30 rounded-lg animate-pulse" />
                        <div className="h-9 w-28 bg-muted/40 dark:bg-muted/30 rounded-lg animate-pulse" />
                      </div>
                    </div>
                    <div className="glass-card rounded-xl overflow-hidden">
                      <div className="border-b border-border/20 dark:border-white/5 h-11 bg-muted/10 dark:bg-white/5 animate-pulse" />
                      <div className="divide-y divide-border/10 dark:divide-white/5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <div className="h-10 w-10 rounded-md bg-muted/40 dark:bg-muted/30 animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-40 bg-muted/40 dark:bg-muted/30 rounded animate-pulse" />
                              <div className="h-3 w-64 bg-muted/30 dark:bg-muted/20 rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-8 rounded-md bg-muted/40 dark:bg-muted/30 animate-pulse ml-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
            <AdminFooter />
          </div>
        </main>
      </div>
    );
  }

  return null;
}


export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
      <AuthProvider>
        <AdminAuthLayout>
          {children}
        </AdminAuthLayout>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
