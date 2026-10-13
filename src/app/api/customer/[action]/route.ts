import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Generic handler for /api/customer/[action]
export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
    const { action } = await params; // update-profile, update-address, get (though get is POST usually in our setup?)

    // Construct Worker URL
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) {
        return NextResponse.json({ error: 'Worker URL not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();

        // Forward to Worker: /customer/<action>
        const res = await fetch(`${workerUrl}/customer/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Proxy failed' }, { status: 500 });
    }
}
