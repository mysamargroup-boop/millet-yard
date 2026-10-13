"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth";
import { useToast } from "@/hooks/use-toast";

interface UpdateProfileProps {
    phone: string;
    onComplete: () => void;
}

export default function UpdateProfile({ phone, onComplete }: UpdateProfileProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { updateProfile } = useCustomerAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: "Name Required", description: "Please enter your name to continue.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        // Call API to update profile
        // Logic will be in customer-auth.tsx
        try {
            await updateProfile(phone, { name, email });
            toast({ title: "Profile Updated", description: "Welcome to Millet Yard!" });
            onComplete();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">One Last Step</h2>
                <p className="text-sm text-muted-foreground">Please tell us your name to personalize your experience.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        placeholder="e.g. Rahul Sharma"
                        className="h-12 text-lg"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        autoFocus
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        className="h-12 text-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Save & Continue
                </Button>
            </form>
        </div>
    );
}
