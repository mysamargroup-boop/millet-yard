
import { notFound } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Phone, Calendar, IndianRupee, Hash, CheckCircle, AlertCircle, Clock, ShoppingCart, RotateCcw, DollarSign, MapPin, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BLUR_DATA_URL } from "@/lib/constants";
import OrderManagementActions from '@/components/order-management-actions';
import { supabaseAdmin } from "@/lib/supabase";
import DownloadInvoiceButton from "@/components/admin/DownloadInvoiceButton";

async function getOrder(orderId: string) {
    try {
        const { data, error } = await supabaseAdmin()
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            amount: Number((data as any).total_amount ?? 0),
            subtotal: Number((data as any).subtotal_amount ?? (data as any).total_amount ?? 0),
            shippingCost: Number((data as any).shipping_cost ?? 0),
            customerName: (data as any).customer_name || '',
            customerPhone: (data as any).customer_phone || '',
            customerAddress: (data as any).customer_address || '', // Ensure this is mapped
            status: (data as any).status || 'PENDING',
            createdAt: (data as any).created_at || new Date().toISOString(),
            updatedAt: (data as any).updated_at || (data as any).created_at || new Date().toISOString(),
            transactionId: (data as any).transaction_id || undefined,
            paymentStatus: (data as any).payment_status || undefined,
            items: Array.isArray((data as any).order_items)
                ? (data as any).order_items.map((oi: any) => ({
                    id: oi.product_id || oi.sku || oi.id,
                    product_name: oi.product_name || 'Item',
                    quantity: Number(oi.quantity ?? 1),
                    unit_price: Number(oi.unit_price ?? oi.total_price ?? 0),
                    unit_cost_price: Number(oi.unit_cost_price ?? 0),
                }))
                : [],
            external_order_id: (data as any).external_order_id,
            payment_method: (data as any).payment_method,
            discount_amount: Number((data as any).discount_amount ?? 0),
            raw: data // Keep raw for invoice
        };
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

async function getProductById(productId: string) {
    try {
        const { data, error } = await supabaseAdmin()
            .from('products')
            .select('*')
            .eq('id', productId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            ...data,
            imageUrl: (data as any).image_url,
            imageHint: (data as any).image_hint,
            category: (data as any).category_id || '',
            regularPrice: Number((data as any).regular_price || 0), // Use actual regular price from DB
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params;
    const order = await getOrder(orderId);

    if (!order) {
        notFound();
    }

    const { data: siteSettings } = await supabaseAdmin()
        .from('site_settings')
        .select('*')
        .maybeSingle();

    const statusIcon = order.status === 'PAID'
        ? <CheckCircle className="h-5 w-5 text-green-600" />
        : order.status === 'PENDING'
            ? <Clock className="h-5 w-5 text-yellow-600" />
            : order.status === 'CANCELLED'
                ? <AlertCircle className="h-5 w-5 text-red-600" />
                : order.status === 'RETURNED'
                    ? <RotateCcw className="h-5 w-5 text-orange-600" />
                    : order.status === 'REFUNDED'
                        ? <DollarSign className="h-5 w-5 text-blue-600" />
                        : <AlertCircle className="h-5 w-5 text-red-600" />;

    const itemsWithDetails = await Promise.all(
        (order.items || []).map(async (item: any) => {
            const product = await getProductById(item.id);
            const regularPrice = product?.regularPrice || item.unit_price;
            const hasDiscount = regularPrice > item.unit_price;
            const discountPercent = hasDiscount ? Math.round(((regularPrice - item.unit_price) / regularPrice) * 100) : 0;

            return {
                ...item,
                name: item.product_name,
                imageUrl: product?.imageUrl || 'https://picsum.photos/seed/placeholder/100',
                imageHint: product?.imageHint || 'product image',
                category: product?.category || '',
                regularPrice,
                hasDiscount,
                discountPercent
            };
        })
    );


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
                    <p className="text-muted-foreground">Viewing information for order <span className="px-2 py-0.5 rounded bg-muted font-mono">{order.id}</span></p>
                </div>
                <DownloadInvoiceButton 
                    order={order.raw} 
                    items={order.items} 
                    siteSettings={siteSettings} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Ordered Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">Image</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {itemsWithDetails.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">No items found in this order.</TableCell>
                                            </TableRow>
                                        )}
                                        {itemsWithDetails.map(item => {
                                            const categorySlug = item.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-');
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Link href={`/collections/${categorySlug}/${item.id}`} className="font-medium hover:underline" target="_blank">
                                                            {item.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span>₹{Number(item.price || 0).toFixed(2)}</span>
                                                            {item.hasDiscount && (
                                                                <span className="text-xs text-muted-foreground line-through">
                                                                    ₹{Number(item.regularPrice).toFixed(2)}
                                                                </span>
                                                            )}
                                                            {item.hasDiscount && (
                                                                <span className="text-[10px] text-green-600 font-medium">
                                                                    {item.discountPercent}% OFF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.paymentStatus ? (
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {order.paymentStatus === 'SUCCESS' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cashfree Status</p>
                                        <p className="font-semibold">{order.paymentStatus}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No payment status information available (likely a pending order).</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Order ID</p>
                                    <p className="font-semibold font-mono text-sm px-2 py-0.5 rounded bg-muted inline-block">{order.id}</p>
                                    {order.transactionId && (
                                        <p className="text-xs text-muted-foreground mt-1">Transaction ID: {order.transactionId}</p>
                                    )}
                                </div>
                            </div>

                            {/* Subtotal */}
                            <div className="flex items-start gap-3 justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Subtotal</p>
                                </div>
                                <p className="font-semibold text-sm">₹{order.subtotal.toFixed(2)}</p>
                            </div>

                            {/* Shipping */}
                            <div className="flex items-start gap-3 justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <Truck className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Shipping</p>
                                </div>
                                <p className="font-semibold text-sm">
                                    {order.shippingCost > 0 ? `₹${order.shippingCost.toFixed(2)}` : 'Free'}
                                </p>
                            </div>

                            {/* Total Amount */}
                            <div className="flex items-start gap-3 justify-between w-full pt-2 border-t">
                                <div className="flex items-center gap-3">
                                    <IndianRupee className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-sm font-bold">Total</p>
                                </div>
                                <p className="font-bold text-lg">₹{order.amount.toFixed(2)}</p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1">{statusIcon}</div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <Badge
                                        className={cn(
                                            'text-xs',
                                            order.status === 'PAID' && 'bg-green-100 text-green-800 border-green-200',
                                            order.status === 'PENDING' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                            order.status === 'FAILED' && 'bg-red-100 text-red-800 border-red-200',
                                            order.status === 'CANCELLED' && 'bg-red-100 text-red-800 border-red-200',
                                            order.status === 'RETURNED' && 'bg-orange-100 text-orange-800 border-orange-200',
                                            order.status === 'REFUNDED' && 'bg-blue-100 text-blue-800 border-blue-200'
                                        )}
                                    >
                                        {order.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Created / Updated</p>
                                    <p className="font-semibold text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                                    <p className="font-semibold text-sm">{new Date(order.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="font-semibold text-sm">{order.customerName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-semibold text-sm">{order.customerPhone}</p>
                                </div>
                            </div>
                            {(order as any).customerAddress && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Shipping Address</p>
                                        <p className="font-semibold text-sm">{(order as any).customerAddress}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <OrderManagementActions
                        orderId={order.id}
                        currentStatus={order.status}
                        amount={order.amount}
                    />
                </div>
            </div>
        </div>
    );
}

