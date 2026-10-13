import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

        if (!workerUrl) {
            return NextResponse.json({ error: 'Worker URL not configured' }, { status: 500 });
        }

        const response = await fetch(`${workerUrl}/api/account/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
