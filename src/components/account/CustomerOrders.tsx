"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Package, ExternalLink } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth';
import { API } from '@/config/api';
import { Badge } from '@/components/ui/badge';

export function CustomerOrders() {
    const { customer } = useCustomerAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!customer?.phone) return;

        const fetchOrders = async () => {
            try {
                // Use Workers by default, Next.js API only if explicitly enabled
                const useNextApi = process.env.NEXT_PUBLIC_USE_NEXTJS_API === 'true';
                const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || '';

                const apiUrl = useNextApi ? '/api/order-status' : `${workerUrl}/order-status`;

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: customer.phone })
                });

                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [customer]);

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-lg font-medium">No Orders Yet</h3>
                <p className="text-muted-foreground">You haven't placed any orders with us yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3 border-b">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold">
                                    Order #{order.external_order_id || order.id?.toString().slice(0, 8)}
                                </CardTitle>
                                <CardDescription>
                                    Placed on {new Date(order.created_at).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Badge variant={
                                order.status === 'delivered' ? 'default' :
                                    order.status === 'cancelled' ? 'destructive' : 'secondary'
                            }>
                                {order.status?.toUpperCase() || 'PENDING'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-center text-sm">
                            <div>
                                <p className="font-medium">{order.items ? `${order.items.length} Items` : 'Order Details'}</p>
                                <p className="text-muted-foreground">{order.items?.[0]?.product_name} {order.items?.length > 1 && `+${order.items.length - 1} more`}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-base">₹{order.total_amount}</p>
                                <p className="text-xs text-muted-foreground">{order.payment_status}</p>
                            </div>
                        </div>
                        {order.tracking_id && (
                            <div className="mt-4 pt-4 border-t flex gap-2 items-center text-sm">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Tracking:</span>
                                <a
                                    href={`https://shiprocket.co/tracking/${order.tracking_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-primary hover:underline flex items-center gap-1"
                                >
                                    {order.tracking_id}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                                {order.courier_name && <span className="text-muted-foreground">({order.courier_name})</span>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
