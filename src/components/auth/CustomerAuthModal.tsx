"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CustomerLogin from "./CustomerLogin";
import UpdateProfile from "./UpdateProfile";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface CustomerAuthModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    redirectToAccount?: boolean;
}

export default function CustomerAuthModal({ trigger, open, onOpenChange, redirectToAccount = false }: CustomerAuthModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'login' | 'verify' | 'profile'>('login');
    const [phone, setPhone] = useState("");
    const [hash, setHash] = useState("");
    const router = useRouter();

    const isControlled = open !== undefined && onOpenChange !== undefined;
    const show = isControlled ? open : internalOpen;
    const setShow = isControlled ? onOpenChange : setInternalOpen;

    const handleOtpRequested = (phoneNu: string, otpHash: string) => {
        setPhone(phoneNu);
        setHash(otpHash);
        setCurrentView('verify');
    };

    const handleVerified = (customer: any) => {
        // Check if name is default "Customer" or missing
        if (!customer.name || customer.name === 'Customer') {
            setCurrentView('profile');
            return;
        }

        finishAuth();
    };

    const finishAuth = () => {
        setShow(false);
        if (redirectToAccount) {
            router.push('/account');
        }
        setTimeout(() => {
            setCurrentView('login');
            setPhone("");
            setHash("");
        }, 300);
    };

    const handleBack = () => {
        setCurrentView('login');
        setHash("");
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="w-[90%] sm:max-w-md rounded-2xl shadow-2xl border-0">
                <VisuallyHidden>
                    <DialogTitle>Login</DialogTitle>
                    <DialogDescription>Login with your phone number</DialogDescription>
                </VisuallyHidden>
                {currentView === 'login' && (
                    <CustomerLogin onOtpRequested={handleOtpRequested} />
                )}
                {currentView === 'verify' && (
                    <OtpVerification phone={phone} hash={hash} onVerified={handleVerified} onBack={handleBack} />
                )}
                {currentView === 'profile' && (
                    <UpdateProfile phone={phone} onComplete={finishAuth} />
                )}
            </DialogContent>
        </Dialog>
    );
}


