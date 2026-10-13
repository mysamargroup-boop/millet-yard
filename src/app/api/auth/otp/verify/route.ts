import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Call the worker directly
        // Assuming the worker handles the stateless verification logic we just wrote
        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';
        const endpoint = `${workerUrl}/api/auth/otp/verify`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
