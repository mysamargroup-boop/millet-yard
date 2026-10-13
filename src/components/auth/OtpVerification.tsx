"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/lib/customer-auth";
import { Loader2, CheckCircle, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

interface OtpVerificationProps {
    phone: string;
    hash: string;
    onVerified: (customer: any) => void;

    onBack: () => void;
}

export default function OtpVerification({ phone, hash, onVerified, onBack }: OtpVerificationProps) {
    const [otp, setOtp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { verifyOtp } = useCustomerAuth();
    const { toast } = useToast();

    const handleVerify = async (code: string) => {
        setIsSubmitting(true);
        const result = await verifyOtp(phone, code, hash);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: "Welcome!", description: "Verification successful." });
            // Retrieve customer from session since verifyOtp updates it
            const stored = localStorage.getItem("milletyard-customer-session");
            const customer = stored ? JSON.parse(stored) : null;
            onVerified(customer);
        } else {

            setOtp("");
            toast({ title: "Invalid OTP", description: result.message || "Please try again.", variant: "destructive" });
        }
    };

    const handleComplete = (code: string) => {
        setOtp(code);
        handleVerify(code);
    };

    const formatPhone = (p: string) => {
        if (p.startsWith('91') && p.length === 12) {
            return `+91 ${p.slice(2, 7)} ${p.slice(7)}`;
        }
        return `+${p}`;
    };

    return (
        <div className="space-y-6">
            {/* Header with back button */}
            <div className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -left-2 -top-2 h-8 w-8 rounded-full hover:bg-muted"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Icon and Title */}
            <div className="text-center space-y-3 pt-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Verify OTP</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter the 6-digit code sent to
                    </p>
                    <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1 mt-1">
                        <KeyRound className="w-3 h-3" />
                        {formatPhone(phone)}
                    </p>
                </div>
            </div>

            {/* OTP Input */}
            <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        onComplete={handleComplete}
                        disabled={isSubmitting}
                        className="gap-3"
                    >
                        <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={0} className="w-10 h-12 md:w-11 md:h-14 text-2xl font-bold rounded-lg border-2 shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                            <InputOTPSlot index={1} className="w-10 h-12 md:w-11 md:h-14 text-2xl font-bold rounded-lg border-2 shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                            <InputOTPSlot index={2} className="w-10 h-12 md:w-11 md:h-14 text-2xl font-bold rounded-lg border-2 shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                        </InputOTPGroup>
                        <div className="flex items-center justify-center w-4">
                            <div className="w-2 h-0.5 bg-muted-foreground rounded" />
                        </div>
                        <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={3} className="w-10 h-12 md:w-11 md:h-14 text-2xl font-bold rounded-lg border-2 shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                            <InputOTPSlot index={4} className="w-10 h-12 md:w-11 md:h-14 text-2xl font-bold rounded-lg border-2 shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                            <InputOTPSlot index={5} className="w-10 h-12 md:w-11 md:h-14 text-2xl font-bold rounded-lg border-2 shadow-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                        </InputOTPGroup>
                    </InputOTP>

                    {isSubmitting && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                {/* Verify Button */}
                <Button
                    onClick={() => handleVerify(otp)}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={otp.length !== 6 || isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    Verify & Login
                </Button>

                {/* Resend */}
                <p className="text-xs text-muted-foreground text-center">
                    Didn't receive code?{" "}
                    <button
                        className="underline text-primary font-medium hover:text-primary/80"
                        onClick={onBack}
                        disabled={isSubmitting}
                    >
                        Resend OTP
                    </button>
                </p>
            </div>
        </div>
    );
}
