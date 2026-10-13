import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, TrendingDown, Package, PieChart } from 'lucide-react';
import { format } from 'date-fns';

async function getPLData() {
    const supabase = supabaseAdmin();
    
    // Fetch last 100 orders and their items
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error('Error fetching P&L data:', error);
        return { orders: [], stats: { revenue: 0, cogs: 0, profit: 0 } };
    }

    let revenue = 0;
    let cogs = 0;
    const productStats: Record<string, { name: string, qty: number, revenue: number, cogs: number }> = {};

    orders?.forEach(order => {
        if (order.status !== 'CANCELLED' && order.status !== 'RETURNED') {
            revenue += Number(order.total_amount || 0);
            
            order.order_items?.forEach((item: any) => {
                const itemCogs = Number(item.unit_cost_price || 0) * Number(item.quantity || 1);
                const itemRev = Number(item.unit_price || 0) * Number(item.quantity || 1);
                cogs += itemCogs;

                if (!productStats[item.product_id]) {
                    productStats[item.product_id] = { name: item.product_name, qty: 0, revenue: 0, cogs: 0 };
                }
                productStats[item.product_id].qty += item.quantity;
                productStats[item.product_id].revenue += itemRev;
                productStats[item.product_id].cogs += itemCogs;
            });
        }
    });

    return {
        stats: {
            revenue,
            cogs,
            profit: revenue - cogs,
            margin: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0
        },
        productWise: Object.values(productStats).sort((a, b) => (b.revenue - b.cogs) - (a.revenue - a.cogs))
    };
}

export default async function PLDashboardPage() {
    const data = await getPLData();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">P&L Dashboard</h1>
                <p className="text-muted-foreground">Real-time profit and loss tracking based on order history.</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.stats.revenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total COGS</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.stats.cogs.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Cost of Goods Sold</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        {data.stats.profit >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", data.stats.profit >= 0 ? "text-green-500" : "text-red-500")}>
                            ₹{data.stats.profit.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats?.margin?.toFixed(2) || '0.00'}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Product Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Product-wise Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-center">Qty Sold</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Profit</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.productWise?.map((p, idx) => {
                                const profit = p.revenue - p.cogs;
                                const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
                                return (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell className="text-center">{p.qty}</TableCell>
                                        <TableCell className="text-right">₹{p.revenue.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">₹{p.cogs.toLocaleString()}</TableCell>
                                        <TableCell className={cn("text-right font-bold", profit >= 0 ? "text-green-500" : "text-red-500")}>
                                            ₹{profit.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">{margin.toFixed(1)}%</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper to use cn in server component if not imported
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
