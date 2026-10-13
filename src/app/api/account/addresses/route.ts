import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';
        const endpoint = `${workerUrl}/api/account/addresses?phone=${phone}`;

        const headers: HeadersInit = {};
        if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
            headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
            headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
        }

        if (process.env.WORKER_API_KEY) {
            headers['X-API-Key'] = process.env.WORKER_API_KEY;
        }

        const res = await fetch(endpoint, {
            method: 'GET',
            headers,
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Proxy GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone && !body.phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

        // Pass phone either in URL or body as per worker expectation
        const url = new URL(`${workerUrl}/api/account/addresses`);
        if (phone) url.searchParams.set('phone', phone);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
            headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
            headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
        }

        if (process.env.WORKER_API_KEY) {
            headers['X-API-Key'] = process.env.WORKER_API_KEY;
        }

        const res = await fetch(url.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...body, phone: phone || body.phone }),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Proxy POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const id = searchParams.get('id');

        if (!phone || !id) {
            return NextResponse.json({ error: 'Phone and ID required' }, { status: 400 });
        }

        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';
        const endpoint = `${workerUrl}/api/account/addresses?phone=${phone}&id=${id}`;

        const headers: HeadersInit = {};
        if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
            headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
            headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
        }

        if (process.env.WORKER_API_KEY) {
            headers['X-API-Key'] = process.env.WORKER_API_KEY;
        }

        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers,
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

