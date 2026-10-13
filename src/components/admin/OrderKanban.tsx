'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, Printer, QrCode, CheckCircle, Clock, Package, Truck, Mail, Upload, AlertCircle, ChevronRight } from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/constants";

interface OrderItem {
    product_name: string;
    quantity: number;
    product_image?: string;
}

interface Order {
    id: string;
    amount: number;
    customerName: string;
    customerPhone: string;
    status: string;
    createdAt: string;
    transactionId?: string;
    items?: OrderItem[];
    trackingNumber?: string;
}

interface OrderCardProps {
    order: Order;
}

// Get initials from customer name
function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA';
}

// Get time ago string
function getTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
}

// Avatar color based on initials
function getAvatarColor(name: string): string {
    const colors = [
        'bg-purple-500 text-white',
        'bg-green-500 text-white',
        'bg-blue-500 text-white',
        'bg-orange-500 text-white',
        'bg-pink-500 text-white',
        'bg-cyan-500 text-white',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

// Order Card for Pending status
export function PendingOrderCard({ order }: OrderCardProps) {
    const initials = getInitials(order.customerName);
    const timeAgo = getTimeAgo(order.createdAt);
    const avatarColor = getAvatarColor(order.customerName);

    return (
        <div className="glass-card rounded-xl p-4 group hover:border-yellow-500/30 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", avatarColor)}>
                        {initials}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
                <span className="text-base font-bold">₹{order.amount.toFixed(2)}</span>
            </div>

            {/* Product Images Preview */}
            {order.items && order.items.length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                    {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-lg bg-muted/30 dark:bg-white/10 overflow-hidden">
                            {item.product_image ? (
                                <Image src={item.product_image} alt={item.product_name} width={32} height={32} className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/20 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Awaiting Payment</span>
                </div>
                <Link href={`/sr-admin/orders/${order.id}`} className="px-3 py-1.5 text-xs bg-muted/30 dark:bg-white/5 rounded-lg hover:bg-muted/50 dark:hover:bg-white/10 transition-colors">
                    Review
                </Link>
            </div>
        </div>
    );
}

// Order Card for Processing status
export function ProcessingOrderCard({ order }: OrderCardProps) {
    const initials = getInitials(order.customerName);
    const avatarColor = getAvatarColor(order.customerName);

    return (
        <div className="glass-card rounded-xl p-4 group hover:border-blue-500/30 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", avatarColor)}>
                        {initials}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">Picking items...</p>
                    </div>
                </div>
                <button className="p-1.5 hover:bg-muted/30 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Printer className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Items List */}
            {order.items && order.items.length > 0 && (
                <div className="space-y-2 mb-3">
                    {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/20 dark:bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded bg-muted/30 dark:bg-white/10 overflow-hidden flex-shrink-0">
                                {item.product_image ? (
                                    <Image src={item.product_image} alt={item.product_name} width={32} height={32} className="object-cover" />
                                ) : (
                                    <Package className="h-4 w-4 m-2 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{item.product_name}</p>
                                <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" />
                        </div>
                    ))}
                </div>
            )}

            {/* Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Picked {order.items?.length || 0}/{(order.items?.length || 0) + 1}</span>
                    <span>Packing Pending</span>
                </div>
                <div className="w-full h-1.5 bg-muted/30 dark:bg-white/10 rounded-full">
                    <div className="w-1/2 h-full bg-blue-500 rounded-full" />
                </div>
            </div>

            <div className="flex gap-2">
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 rounded text-[10px]">
                    <CheckCircle className="h-3 w-3" /> Verified
                </span>
                <Link href={`/sr-admin/orders/${order.id}`} className="px-3 py-1 text-xs bg-[#137fec] text-white rounded hover:bg-[#0d6edb] transition-colors ml-auto">
                    Process
                </Link>
            </div>
        </div>
    );
}

// Order Card for Shipped status
export function ShippedOrderCard({ order }: OrderCardProps) {
    const avatarColor = getAvatarColor(order.customerName);

    return (
        <div className="glass-card rounded-xl p-4 group hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold opacity-70", avatarColor)}>
                    <Truck className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Shipped 2h ago</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            {order.trackingNumber && (
                <div className="flex items-center gap-2 p-2 bg-muted/20 dark:bg-white/5 rounded-lg mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">TRK-{order.trackingNumber.slice(0, 10)}</span>
                </div>
            )}

            <div className="text-xs text-muted-foreground mt-2">
                Est. Delivery: {new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
            </div>
        </div>
    );
}

interface KanbanColumnProps {
    title: string;
    count: number;
    dotColor: 'pending' | 'processing' | 'shipped';
    orders: Order[];
    CardComponent: React.ComponentType<OrderCardProps>;
}

export function KanbanColumn({ title, count, dotColor, orders, CardComponent }: KanbanColumnProps) {
    const dotStyles = {
        pending: 'status-dot-pending',
        processing: 'status-dot-processing',
        shipped: 'status-dot-shipped',
    };

    return (
        <div className="flex flex-col w-full md:w-1/3 min-w-0 md:h-full">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", dotStyles[dotColor])} />
                    <h3 className="font-semibold">{title}</h3>
                    <span className="bg-muted/50 dark:bg-white/5 text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 admin-scrollbar pb-20 max-h-[50vh] md:max-h-none">
                {orders.map((order) => (
                    <CardComponent key={order.id} order={order} />
                ))}
                {orders.length === 0 && (
                    <div className="glass-card rounded-xl p-6 text-center">
                        <p className="text-sm text-muted-foreground">No orders</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface QuickActionsPanelProps {
    totalOrders: number;
    processedOrders: number;
}

export function QuickActionsPanel({ totalOrders, processedOrders }: QuickActionsPanelProps) {
    const percentage = totalOrders > 0 ? Math.round((processedOrders / totalOrders) * 100) : 0;

    return (
        <aside className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0">
            {/* Quick Actions */}
            <div className="glass-panel p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20 dark:border-white/5">
                    <Package className="h-5 w-5 text-[#137fec]" />
                    <h3 className="font-semibold">Quick Actions</h3>
                </div>
                <div className="flex flex-col gap-1">
                    <QuickActionButton icon={<Printer className="h-4 w-4" />} label="Print Labels" />
                    <QuickActionButton icon={<Mail className="h-4 w-4" />} label="Notify Customers" />
                    <QuickActionButton icon={<Upload className="h-4 w-4" />} label="Bulk Export" />
                </div>
            </div>

            {/* Today's Goal */}
            <div className="glass-panel p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Goal</h4>
                    <span className="text-sm font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-muted/30 dark:bg-white/10 rounded-full h-2 mb-2">
                    <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)'
                        }}
                    />
                </div>
                <p className="text-xs text-muted-foreground">{processedOrders}/{totalOrders} orders processed</p>
            </div>
        </aside>
    );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted/30 dark:hover:bg-white/10 text-left transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-muted/30 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#137fec]/20 group-hover:text-[#137fec] transition-colors">
                {icon}
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground">{label}</span>
        </button>
    );
}
