'use client';

import { useEffect, useState } from 'react';
import { Package, LayoutGrid, ShoppingBag, TrendingUp, Users, DollarSign, IndianRupee, ArrowUpRight, ArrowDownRight, MoreHorizontal, Plus, Filter, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: string;
  inventory: number;
}

interface Category {
  id: string;
  name: string;
}

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  items?: { product_name: string; quantity: number }[];
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, paidOrders: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, ordersRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/orders')
        ]);

        if (productsRes.ok) setProducts(await productsRes.json());
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          // Calculate stats from ALL orders before slicing
          const revenue = ordersData.reduce((sum: number, o: Order) => sum + Number(o.total_amount || 0), 0);
          const paid = ordersData.filter((o: Order) => o.status === 'PAID' || o.status === 'SHIPPED').length;

          setStats({
            revenue,
            totalOrders: ordersData.length,
            paidOrders: paid
          });

          setOrders(ordersData.slice(0, 5));
        }
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const topProducts = products.slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">Welcome back, here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="glass-card px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors flex-1 sm:flex-none justify-center">
            <Filter className="h-4 w-4" />
            Last 30 Days
          </button>
          <Link href="/sr-admin/products/new" className="bg-[#137fec] hover:bg-[#0d6edb] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sales"
          value={`₹${stats.revenue.toLocaleString()}`}
          change="+12%"
          changeType="positive"
          icon={<IndianRupee className="h-5 w-5" />}
          iconBg="bg-green-500/20 text-green-400"
        />
        <StatsCard
          title="Total Products"
          value={products.length.toString()}
          change="+5%"
          changeType="positive"
          icon={<Package className="h-5 w-5" />}
          iconBg="bg-orange-500/20 text-orange-400"
        />
        <StatsCard
          title="New Orders"
          value={stats.totalOrders.toString()}
          change="+8%"
          changeType="positive"
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-blue-500/20 text-blue-400"
        />
        <StatsCard
          title="Categories"
          value={categories.length.toString()}
          change="-1%"
          changeType="negative"
          icon={<LayoutGrid className="h-5 w-5" />}
          iconBg="bg-purple-500/20 text-purple-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Revenue vs Expenses</h3>
              <p className="text-sm text-muted-foreground">Monthly performance overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Expenses</span>
              </div>
            </div>
          </div>
          {/* Chart Placeholder - using SVG for a simple chart representation */}
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 50, 100, 150, 200].map((y) => (
                <line
                  key={y}
                  x1="0" y1={y} x2="600" y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4,4"
                />
              ))}
              {/* Revenue line */}
              <path
                d="M0,180 Q50,160 100,140 T200,100 T300,80 T400,60 T500,70 T600,50"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              {/* Revenue area */}
              <path
                d="M0,180 Q50,160 100,140 T200,100 T300,80 T400,60 T500,70 T600,50 L600,200 L0,200 Z"
                fill="url(#blueGradient)"
                opacity="0.3"
              />
              {/* Expenses line */}
              <path
                d="M0,190 Q100,180 200,170 T400,150 T600,140"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2 pb-6">
              {['Jan 01', 'Jan 05', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30'].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products Sidebar */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Products</h3>
            <Link href="/sr-admin/products" className="text-sm text-[#137fec] hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 dark:hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">₹{product.price} • {product.inventory} in stock</p>
                </div>
                <span className={cn(
                  "text-xs font-semibold",
                  idx % 2 === 0 ? "text-green-500" : "text-red-500"
                )}>
                  {idx % 2 === 0 ? '+12%' : '-2%'}
                </span>
              </div>
            ))}
          </div>
          <Link href="/sr-admin/products" className="block mt-4">
            <button className="w-full py-2 text-sm text-center glass-card rounded-lg hover:bg-muted/50 dark:hover:bg-white/10 transition-colors">
              View All Products
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/20 dark:border-white/5">
          <h3 className="font-semibold text-lg">Recent Orders</h3>
          <div className="flex items-center gap-2">
            <button className="glass-card px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:bg-muted/50 transition-colors">
              <Filter className="h-3 w-3" />
              Filter
            </button>
            <button className="glass-card px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:bg-muted/50 transition-colors">
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20 dark:border-white/5">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No recent orders</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/10 dark:border-white/5 hover:bg-muted/30 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm">{order.customer_name || 'Unknown'}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right hidden sm:table-cell">
                      <span className="text-sm font-semibold">₹{Number(order.total_amount || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-center hidden sm:table-cell">
                      <Link href={`/sr-admin/orders/${order.id}`}>
                        <button className="p-1.5 rounded-lg hover:bg-muted/50 dark:hover:bg-white/10 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
  iconBg: string;
}

function StatsCard({ title, value, change, changeType, icon, iconBg }: StatsCardProps) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              changeType === 'positive' ? "text-green-500" : "text-red-500"
            )}>
              {changeType === 'positive' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {change}
            </div>
          </div>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    PAID: 'bg-green-500/20 text-green-500',
    SHIPPED: 'bg-blue-500/20 text-blue-500',
    PENDING: 'bg-yellow-500/20 text-yellow-500',
    PROCESSING: 'bg-blue-500/20 text-blue-500',
    FAILED: 'bg-red-500/20 text-red-500',
    CANCELLED: 'bg-red-500/20 text-red-500',
  };

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium",
      statusStyles[status] || 'bg-gray-500/20 text-gray-500'
    )}>
      {status}
    </span>
  );
}
