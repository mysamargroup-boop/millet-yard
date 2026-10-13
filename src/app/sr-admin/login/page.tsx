
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/icons/Logo";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      await signIn(email, password);
      router.push("/sr-admin/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please check your email and password.",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphism Card with White Gradient */}
      <div className="w-full max-w-sm border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5">
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="text-center space-y-2">
            <div className="flex flex-col items-center justify-center mb-6">
              <Logo className="text-2xl md:text-3xl" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Admin Access</h1>
            <p className="text-sm text-gray-300 font-medium tracking-wide">Enter your credentials to continue</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200 font-medium ml-1">Email</Label>
              <input
                id="email"
                type="email"
                placeholder="admin@milletyard.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137fec]/70 focus:border-[#137fec]/70 text-white placeholder:text-gray-500 transition-all duration-200 hover:bg-black/30"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-200 font-medium ml-1">Password</Label>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137fec]/70 focus:border-[#137fec]/70 text-white placeholder:text-gray-500 transition-all duration-200 hover:bg-black/30"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#137fec] to-[#0b61b5] hover:from-[#1589ff] hover:to-[#0d6edb] text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-xl shadow-blue-900/40 transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
