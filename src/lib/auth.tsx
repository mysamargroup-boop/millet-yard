
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// User type
type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Verify session with server on mount and periodically
  const verifySession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/admin-verify', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      const data = await res.json();

      if (res.ok && data.authenticated && data.email) {
        setUser({ email: data.email });
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verify session on mount
    verifySession();

    // Verify session every 5 minutes
    const interval = setInterval(verifySession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [verifySession]);

  const signIn = useCallback(async (email: string, pass: string) => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Server sets HttpOnly cookie, we just update local state
      if (data.success && data.email) {
        setUser({ email: data.email });
        toast({ title: "Welcome Back", description: "Successfully logged in." });
      }

    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    
    try {
      // Call logout endpoint to clear server-side session
      await fetch('/api/auth/admin-logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Continue with logout even if API call fails
    }

    setUser(null);
    setLoading(false);
    router.push("/sr-admin/login");
    toast({ title: "Logged Out", description: "You have been successfully signed out." });
  }, [router, toast]);

  const value = { user, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
