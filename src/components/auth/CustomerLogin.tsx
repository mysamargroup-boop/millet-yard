"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/lib/customer-auth";
import { Loader2, Phone, Smartphone } from "lucide-react";
import Link from "next/link";

interface CustomerLoginProps {
    onOtpRequested: (phone: string, hash: string) => void;
}

export default function CustomerLogin({ onOtpRequested }: CustomerLoginProps) {
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { requestOtp } = useCustomerAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) {
            toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        // Ensure phone starts with 91 if not present, strip others
        const cleanPhone = phone.replace(/\D/g, "");
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const result = await requestOtp(finalPhone);
        setIsSubmitting(false);

        if (result.success && result.hash) {
            toast({ title: "OTP Sent", description: "Please check your WhatsApp for the OTP." });
            onOtpRequested(finalPhone, result.hash);
        } else {
            toast({ title: "Error", description: result.message || "Failed to get OTP hash", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4">
                    <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Welcome Back</h2>
                <p className="text-sm text-muted-foreground">Login with your mobile number via WhatsApp OTP</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">IN</span>
                            <span>+91</span>
                        </span>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            className="pl-16 h-12 text-lg"
                            value={phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setPhone(val);
                            }}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting || phone.length < 10}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
                    Get OTP via WhatsApp
                </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-primary">Terms & Conditions</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
            </p>
        </div>
    );
}

