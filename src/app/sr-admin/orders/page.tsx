'use client';
import { useState, useEffect, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Search, LayoutGrid, List, RefreshCw, Plus } from 'lucide-react';
import { KanbanColumn, QuickActionsPanel, PendingOrderCard, ProcessingOrderCard, ShippedOrderCard } from "@/components/admin/OrderKanban";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreateManualOrderModal } from '@/components/admin/CreateManualOrderModal';

interface Order {
  id: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  items?: { product_name: string; quantity: number; product_image?: string }[];
  trackingNumber?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (!res.ok) {
        let message = 'Failed to fetch orders';
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
        }
        throw new Error(message);
      }
      const rows = await res.json();
      const mapped: Order[] = (rows || []).map((row: any) => ({
        id: row.id,
        amount: Number(row.total_amount ?? 0),
        customerName: row.customer_name || '',
        customerPhone: row.customer_phone || '',
        status: row.status || 'PENDING',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
        transactionId: row.transaction_id || undefined,
        trackingNumber: row.tracking_number || undefined,
        items: row.items || [],
      }));
      setOrders(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o =>
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.customerPhone.includes(term)
    );
  }, [orders, searchTerm]);

  // Group orders by status
  const pendingOrders = filteredOrders.filter(o => ['PENDING', 'AWAITING_PAYMENT'].includes(o.status));
  const processingOrders = filteredOrders.filter(o => ['PAID', 'PROCESSING'].includes(o.status));
  const shippedOrders = filteredOrders.filter(o => ['SHIPPED', 'DELIVERED'].includes(o.status));

  if (loading) {
    return (
      <div className="space-y-6 h-full">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-7 w-56 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
        {/* Skeleton Kanban Columns */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {Array.from({ length: 3 }).map((_, colIdx) => (
            <div key={colIdx} className="flex-1 min-w-0 space-y-3">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div key={cardIdx} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                  </div>
                  <div className="h-3 w-36 bg-muted animate-pulse rounded" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={fetchOrders} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order Fulfillment Center</h1>
          <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Create Manual Order Button */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#137fec] hover:bg-[#137fec]/90 text-white gap-2 h-9 px-3 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Order</span>
          </Button>

          {/* View Toggle */}
          <div className="flex items-center gap-1 glass-card rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'kanban' ? "bg-[#137fec] text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title="Kanban View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'table' ? "bg-[#137fec] text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10 pr-4 py-2 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#137fec]/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[calc(100vh-220px)]">
          {/* Kanban Columns */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 pb-4">
            <KanbanColumn
              title="Pending"
              count={pendingOrders.length}
              dotColor="pending"
              orders={pendingOrders}
              CardComponent={PendingOrderCard}
            />
            <KanbanColumn
              title="Processing"
              count={processingOrders.length}
              dotColor="processing"
              orders={processingOrders}
              CardComponent={ProcessingOrderCard}
            />
            <KanbanColumn
              title="Shipped"
              count={shippedOrders.length}
              dotColor="shipped"
              orders={shippedOrders}
              CardComponent={ShippedOrderCard}
            />
          </div>

          {/* Quick Actions */}
          <QuickActionsPanel
            totalOrders={orders.length}
            processedOrders={processingOrders.length + shippedOrders.length}
          />
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/20 dark:border-white/5 hover:bg-transparent">
                  <TableHead className="w-[120px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-b border-border/10 dark:border-white/5 hover:bg-muted/30 dark:hover:bg-white/5 transition-colors">
                      <TableCell>
                        <Link
                          href={`/sr-admin/orders/${order.id}`}
                          className="font-mono text-sm font-semibold text-[#137fec] hover:underline"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{order.customerPhone || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short'
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            'text-xs pointer-events-none font-medium',
                            order.status === 'PAID' && 'bg-green-500/20 text-green-500 border-green-500/30',
                            order.status === 'PENDING' && 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                            order.status === 'PROCESSING' && 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                            order.status === 'SHIPPED' && 'bg-green-500/20 text-green-500 border-green-500/30',
                            order.status === 'DELIVERED' && 'bg-purple-500/20 text-purple-500 border-purple-500/30',
                            order.status === 'FAILED' && 'bg-red-500/20 text-red-500 border-red-500/30',
                            order.status === 'CANCELLED' && 'bg-red-500/20 text-red-500 border-red-500/30',
                          )}
                          variant="outline"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{order.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {/* Modals */}
      <CreateManualOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchOrders}
      />
    </div>
  );
}
