"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { API } from "@/config/api";

type Customer = {
    id: string; // UUID from DB
    name: string;
    phone: string;
    email?: string;
    address_json?: any;
    verified: boolean;
    expiresAt?: number;
};

type CustomerAuthContextType = {
    customer: Customer | null;
    isLoading: boolean;
    requestOtp: (phone: string) => Promise<{ success: boolean; message: string; hash?: string }>;
    verifyOtp: (phone: string, otp: string, hash: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    updateProfile: (phone: string, data: { name?: string; email?: string; address_json?: any }) => Promise<any>;
    loading: boolean;
    updateCustomer: (phone: string, data: { name?: string; email?: string; address_json?: any }) => Promise<any>;
};


const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const stored = localStorage.getItem("milletyard-customer-session");
        if (stored) {
            try {
                const session = JSON.parse(stored);
                // Check expiry if exists
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    localStorage.removeItem("milletyard-customer-session");
                    setCustomer(null);
                } else {
                    setCustomer(session);
                }
            } catch {
                localStorage.removeItem("milletyard-customer-session");
            }
        }
        setLoading(false);
    }, []);

    const requestOtp = async (phone: string) => {
        try {
            // DEV MODE: Bypass OTP for test number in development
            const isDev = process.env.NODE_ENV === 'development';
            const testPhone = process.env.NEXT_PUBLIC_TEST_PHONE;
            const isTestNumber = testPhone && phone === testPhone;

            if (isDev && isTestNumber) {
                // Return fake hash for dev testing
                return {
                    success: true,
                    message: `DEV: Use OTP ${process.env.NEXT_PUBLIC_TEST_OTP || '123456'}`,
                    hash: 'dev-bypass-hash.999999999999'
                };
            }

            // Use API config based or direct proxy endpoint
            const res = await fetch(API.AUTH_OTP_REQUEST, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to request OTP");
            return { success: true, message: data.message, hash: data.hash };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    };

    const verifyOtp = async (phone: string, otp: string, hash: string) => {
        try {
            // DEV MODE: Bypass verification for test number
            const isDev = process.env.NODE_ENV === 'development';
            const testPhone = process.env.NEXT_PUBLIC_TEST_PHONE;
            const testOtp = process.env.NEXT_PUBLIC_TEST_OTP || '123456';

            const isTestNumber = testPhone && phone === testPhone;
            const isTestOtp = otp === testOtp;

            if (isDev && isTestNumber && isTestOtp) {
                // Create fake session for dev testing
                const sessionData: Customer = {
                    id: 'dev-test-user-id',
                    name: 'Dev Tester',
                    phone: phone,
                    email: 'dev@test.com',
                    address_json: {},
                    verified: true,
                    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
                };
                localStorage.setItem("milletyard-customer-session", JSON.stringify(sessionData));
                setCustomer(sessionData);
                return { success: true, message: "DEV: Login successful" };
            }

            const res = await fetch(API.AUTH_OTP_VERIFY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp, hash }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to verify OTP");

            // Save session - data.customer comes from worker
            const customerData = data.customer;

            const sessionData: Customer = {
                id: customerData.id,
                name: customerData.name || 'Customer',
                phone: customerData.phone,
                email: customerData.email,
                address_json: customerData.address_json,
                verified: true,
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days persistence
            };

            localStorage.setItem("milletyard-customer-session", JSON.stringify(sessionData));
            setCustomer(sessionData);

            return { success: true, message: "Login successful" };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    };

    const updateProfile = async (phone: string, data: { name?: string; email?: string }) => {
        try {
            // Use local API proxy which forwards to Worker
            const res = await fetch('/api/account/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, phone })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Update failed');

            // Update local state
            const updated = { ...customer, ...result.customer };
            setCustomer(updated as Customer);
            localStorage.setItem("milletyard-customer-session", JSON.stringify(updated));
            return result;
        } catch (error: any) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("milletyard-customer-session");
        setCustomer(null);
    };

    return (
        <CustomerAuthContext.Provider value={{
            customer,
            isLoading: loading,
            loading, // Alias
            requestOtp,
            verifyOtp,
            logout,
            updateProfile,
            updateCustomer: updateProfile // Alias
        }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) {
        throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
    }
    return context;
};

