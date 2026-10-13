
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, ShoppingBag, TrendingUp, CreditCard, MapPin } from "lucide-react";
import { IndiaMap } from '@/components/admin/analytics/IndiaMap';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/analytics/stats');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Transform Chart Data for Recharts
    const chartData = useMemo(() => {
        if (!data?.chartData) return [];
        return data.chartData.labels.map((label: string, index: number) => ({
            name: label,
            revenue: data.chartData.revenue[index],
            orders: data.chartData.orders[index]
        }));
    }, [data]);

    // Mock State Data if not available from API yet
    const stateData = useMemo(() => {
        // In a real scenario, API should return this. For now, mocking or using what's available.
        // Assuming data.stateDistribution exists or we default.
        return data?.stateDistribution || [
            { state: 'Maharashtra', value: 50 },
            { state: 'Delhi', value: 30 },
            { state: 'Karnataka', value: 25 },
            { state: 'Tamil Nadu', value: 20 },
            { state: 'Gujarat', value: 15 },
        ];
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 md:p-6">
            <div className="flex flex-col gap-2 px-2 md:px-0">
                <h1 className="text-2xl md:text-3xl font-headline font-bold flex items-center gap-3 text-foreground">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-[#137fec]" />
                    Advanced Analytics
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">Comprehensive view of your store's performance.</p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-[#137fec]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">₹{(data?.totalRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All-time earnings</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Successful Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-[#137fec]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{data?.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground">Packed, Shipped, or Delivered</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-[#137fec]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">₹{(data?.avgOrderValue || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Per order average</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-[#137fec]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">₹{(data?.pendingAmount || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Awaiting completion</p>
                    </CardContent>
                </Card>
            </div>

            {/* Order Status Breakdown */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="glass-card border-l-4 border-l-orange-500">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                            Pending Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 pb-4">
                        <div className="text-2xl font-bold text-foreground">{data?.pendingOrdersCount || 0}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card border-l-4 border-l-red-500">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            Failed Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 pb-4">
                        <div className="text-2xl font-bold text-foreground">{data?.failedOrdersCount || 0}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card border-l-4 border-l-slate-500">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]" />
                            Cancelled
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 pb-4">
                        <div className="text-2xl font-bold text-foreground">{data?.cancelledOrdersCount || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <Card className="glass-card border-0">
                    <CardHeader>
                        <CardTitle className="text-foreground">Revenue Trend</CardTitle>
                        <CardDescription className="text-muted-foreground">Daily revenue performance over the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#137fec" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(value: number) => [`₹${value}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Orders Chart */}
                <Card className="glass-card border-0">
                    <CardHeader>
                        <CardTitle className="text-foreground">Order Volume</CardTitle>
                        <CardDescription className="text-muted-foreground">Number of orders placed daily.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar dataKey="orders" fill="#137fec" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Map Section */}
            <Card className="glass-card border-0 overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <MapPin className="h-5 w-5 text-rose-500" />
                        Order Density by Region
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Geographic distribution of your orders across India.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center bg-transparent p-0">
                    <div className="w-full h-full min-h-[400px]">
                        <IndiaMap data={stateData} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
