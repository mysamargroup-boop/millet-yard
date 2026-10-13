"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/customer-auth";
import { API } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Calendar, IndianRupee } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Order {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    items: any[];
    payment_status: string;
    shipping_address: any;
    tracking_id?: string;
    courier_name?: string;
}

export default function MyOrdersList() {
    const { customer, loading: authLoading } = useCustomerAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!customer?.phone) return;

            try {
                const res = await fetch(API.ORDER_STATUS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: customer.phone })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.valid && Array.isArray(data.orders)) {
                        setOrders(data.orders);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };

        if (customer) {
            fetchOrders();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [customer, authLoading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No orders found</h2>
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                <Button asChild>
                    <Link href="/shop">Start Shopping</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div>
                                <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(order.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize 
                  ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {order.status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize 
                  ${order.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {order.payment_status}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            {order.items && order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-4">
                                    {item.image_url && (
                                        <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border">
                                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-medium">
                                        ₹{item.price * item.quantity}
                                    </div>
                                </div>
                            ))}

                            <div className="border-t pt-4 mt-4 flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    {order.tracking_id && (
                                        <p>Tracking: <span className="font-mono">{order.tracking_id}</span> ({order.courier_name})</p>
                                    )}
                                </div>
                                <div className="flex items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <IndianRupee className="h-4 w-4 ml-2 mr-1" />
                                    {order.total_amount}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
