'use client';


import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Truck, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

// Status timeline configuration
const ORDER_STATUSES = [
    { key: 'placed', label: 'Order Placed', icon: Package },
    { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

interface OrderData {
    id: string;
    order_id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    customer_name: string;
    customer_phone: string;
    created_at: string;
    updated_at: string;
    shipping_address?: string;
    tracking_number?: string;
    items?: any[];
}

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId') || '';

    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState(orderId);

    const fetchOrder = async (id: string) => {
        if (!id.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/order-status?orderId=${encodeURIComponent(id)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Order not found');
            }

            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch order');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrder(searchQuery);
    };

    const getStatusIndex = (status: string) => {
        const statusMap: { [key: string]: number } = {
            'pending': 0,
            'placed': 0,
            'confirmed': 1,
            'processing': 1,
            'shipped': 2,
            'out_for_delivery': 2,
            'delivered': 3,
            'completed': 3,
        };
        return statusMap[status?.toLowerCase()] ?? 0;
    };

    const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-6 w-6" />
                        Track Your Order
                    </CardTitle>
                    <CardDescription>
                        Enter your order ID to track the status of your order
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <Input
                            placeholder="Enter Order ID (e.g., ORD-123456)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading}>
                            <Search className="h-4 w-4 mr-2" />
                            {loading ? 'Searching...' : 'Track'}
                        </Button>
                    </form>

                    {/* Error State */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-6">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Order Details */}
                    {order && (
                        <div className="space-y-6">
                            {/* Order Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order ID</p>
                                    <p className="font-semibold">{order.order_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Order Date</p>
                                    <p className="font-semibold">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                        {order.status?.toUpperCase()}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment</p>
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                                        {order.payment_status?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            {/* Status Timeline */}
                            <div className="relative">
                                <h3 className="font-semibold mb-4">Order Progress</h3>
                                <div className="space-y-4">
                                    {ORDER_STATUSES.map((status, index) => {
                                        const Icon = status.icon;
                                        const isCompleted = index <= currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;

                                        return (
                                            <div key={status.key} className="flex items-center gap-4">
                                                <div
                                                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${isCompleted
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                                                        } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {status.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {order.updated_at && `Updated ${new Date(order.updated_at).toLocaleString('en-IN')}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tracking Number & Live Shiprocket Courier Map */}
                            {order.tracking_number && (
                                <>
                                    <Separator />
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Shiprocket AWB / Courier Number</p>
                                            <p className="font-mono font-bold text-base text-foreground mt-0.5">{order.tracking_number}</p>
                                        </div>
                                        <Button asChild className="bg-[#733dd9] hover:bg-[#5f2fb8] text-white flex items-center gap-2 rounded-xl shadow-xs">
                                            <a
                                                href={`https://shiprocket.co/tracking/${order.tracking_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Truck className="h-4 w-4" />
                                                Detailed Courier Live Map ↗
                                            </a>
                                        </Button>
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/connect">Need Help?</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/shop">Continue Shopping</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!order && !loading && !error && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Enter your order ID above to track your order</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function OrderTrackingPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
            <TrackOrderContent />
        </Suspense>
    );
}
