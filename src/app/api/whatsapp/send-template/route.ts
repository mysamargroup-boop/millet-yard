import { NextResponse } from 'next/server';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud';

export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await sendWhatsAppTemplateMessage({
      to,
      templateName: 'hello_world',
      languageCode: 'en_US',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('WhatsApp Test Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
