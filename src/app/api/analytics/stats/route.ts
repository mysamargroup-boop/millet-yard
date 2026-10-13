
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-middleware";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Require admin authentication for viewing analytics
        const authResult = await requireAdminAuth(req);
        if (authResult instanceof NextResponse) {
            return authResult; // Return 401 if not authenticated
        }

        const adminClient = supabaseAdmin();

        if (!adminClient) {
            return NextResponse.json({ error: "Admin client failed" }, { status: 500 });
        }

        // Fetch all orders with customer details
        const { data: orders, error } = await adminClient
            .from('orders')
            .select('id, total_amount, status, created_at, payment_status, customer_address, customer:customers(address)');

        if (error) {
            console.error("Analytics fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Classification Logic
        const successfulOrders = orders.filter(o =>
            o.status === 'PAID' ||
            o.payment_status === 'SUCCESS' ||
            o.status === 'delivered' ||
            o.status === 'shipped' ||
            o.status === 'completed'
        );

        const cancelledOrders = orders.filter(o => o.status === 'cancelled');
        const failedOrders = orders.filter(o => o.payment_status === 'FAILED' || o.status === 'failed');

        // Pending: Not success, not cancelled, not failed
        const pendingOrders = orders.filter(o => {
            const isSuccess = o.status === 'PAID' || o.payment_status === 'SUCCESS' || o.status === 'delivered' || o.status === 'shipped' || o.status === 'completed';
            const isCancelled = o.status === 'cancelled';
            const isFailed = o.payment_status === 'FAILED' || o.status === 'failed';
            return !isSuccess && !isCancelled && !isFailed;
        });

        const totalRevenue = successfulOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
        // User request: "success orders values ka amount sirf".
        // Verified: successfulOrders is already filtered above.
        // Double check filtering logic:
        // const successfulOrders = orders.filter(o => o.status === 'PAID' || ...);
        // So totalRevenue is correct.

        const averageOrderValue = successfulOrders.length > 0 ? totalRevenue / successfulOrders.length : 0;

        // Calculate last 7 days revenue (Strictly for Successful Orders)
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        }).reverse();

        const revenueByDay = last7Days.reduce((acc, day) => {
            acc[day] = 0;
            return acc;
        }, {} as Record<string, number>);

        const ordersByDay = last7Days.reduce((acc, day) => {
            acc[day] = 0;
            return acc;
        }, {} as Record<string, number>);

        successfulOrders.forEach(o => {
            const d = new Date(o.created_at);
            const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            if (revenueByDay[day] !== undefined) {
                revenueByDay[day] += (Number(o.total_amount) || 0);
                ordersByDay[day] += 1;
            }
        });

        // Calculate State Distribution (Order Density)
        const indianStates = [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
            'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
            'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
            'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
            'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
        ];

        const stateDistMap: Record<string, number> = {};

        // Use all orders (not just paid) or just paid? Typically analytics uses Paid for revenue, but density might want all demand.
        // Let's use Paid for consistent "Orders" metric usually.
        successfulOrders.forEach(o => {
            let state = '';

            // 1. Try parsing text address from Order (Snapshot)
            if (o.customer_address) {
                const addr = o.customer_address.toLowerCase();
                // Find matching state
                const found = indianStates.find(s => addr.includes(s.toLowerCase()));
                if (found) state = found;
            }
            // 2. Try Customer Profile Address if Order address is missing/incomplete
            // @ts-ignore
            else if (o.customer?.address) {
                // @ts-ignore
                const addr = o.customer.address.toLowerCase();
                const found = indianStates.find(s => addr.includes(s.toLowerCase()));
                if (found) state = found;
            }

            // Normalize state name if possible using list (Simple check)
            if (state) {
                const normalized = indianStates.find(s => s.toLowerCase() === state.toLowerCase()) || state;
                stateDistMap[normalized] = (stateDistMap[normalized] || 0) + 1;
            }
        });

        const stateDistribution = Object.entries(stateDistMap)
            .map(([state, value]) => ({ state, value }))
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({
            successfulOrdersCount: successfulOrders.length,
            pendingOrdersCount: pendingOrders.length,
            failedOrdersCount: failedOrders.length,
            cancelledOrdersCount: cancelledOrders.length,

            // Standard keys for UI
            totalOrders: successfulOrders.length, // Overriding this to be "Success Orders" as per request
            totalRevenue,
            averageOrderValue,
            conversionRate: 0,
            chartData: {
                labels: last7Days,
                revenue: Object.values(revenueByDay),
                orders: Object.values(ordersByDay)
            },
            stateDistribution
        });

    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
