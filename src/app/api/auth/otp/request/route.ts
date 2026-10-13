import { NextResponse } from 'next/server';
import { API } from '@/config/api';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // The API config already handles endpoint selection based on env,
        // but here we are IN the Next.js API, so we want to call the Worker directly
        // if we are acting as a proxy.
        // Ideally, API.AUTH_REQUEST_OTP points to the Worker if running on client.
        // If running on server, we should probably have a separate config or just call the Worker URL.
        // Let's assume we need to call the Worker URL from .env.

        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'; // Default fallback
        const endpoint = `${workerUrl}/api/auth/otp/request`;

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
