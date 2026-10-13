
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const adminClient = supabaseAdmin();
        const envCheck = {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
            nodeEnv: process.env.NODE_ENV
        };

        if (!adminClient) {
            return NextResponse.json({
                error: "Admin Client Init Failed",
                details: "supabaseAdmin() returned null",
                env: envCheck
            }, { status: 500 });
        }

        const { data, error } = await adminClient.from('categories').select('*');

        if (error) {
            return NextResponse.json({
                error: "Supabase Query Failed",
                details: error.message,
                code: error.code,
                hint: error.hint,
                env: envCheck
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: data?.length,
            data: data,
            env: envCheck
        });

    } catch (err: any) {
        return NextResponse.json({
            error: "Unexpected Error",
            details: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
