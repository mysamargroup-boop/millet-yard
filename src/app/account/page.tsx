"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/customer-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddressBook from "@/components/account/AddressBook";
import MyOrdersList from "@/components/account/MyOrdersList"; // Creating this next by extracting from old page

export default function AccountPage() {
    const { customer, logout, loading: authLoading } = useCustomerAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !customer) {
            router.push("/");
        }
    }, [customer, authLoading, router]);

    if (!customer) return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">My Account</h1>
                    <p className="text-muted-foreground">Welcome back, {customer.name || customer.phone}</p>
                </div>
                <Button variant="outline" onClick={logout} className="gap-2 text-destructive hover:text-destructive">
                    <LogOut className="h-4 w-4" /> Logout
                </Button>
            </div>

            <Tabs defaultValue="orders" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="orders" className="gap-2">
                        <Package className="h-4 w-4" /> My Orders
                    </TabsTrigger>
                    <TabsTrigger value="addresses" className="gap-2">
                        <MapPin className="h-4 w-4" /> Addresses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="bg-white dark:bg-card rounded-xl border p-6 shadow-sm">
                    <MyOrdersList />
                </TabsContent>

                <TabsContent value="addresses" className="bg-white dark:bg-card rounded-xl border p-6 shadow-sm">
                    <AddressBook />
                </TabsContent>
            </Tabs>
        </div>
    );
}
