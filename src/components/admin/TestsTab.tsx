
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { handleSubscription } from '@/ai/flows/handle-subscription';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CreditCard, ShoppingBag, List, MessageCircle, Link, Key, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function TestsTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [whatsappTestNumber, setWhatsappTestNumber] = useState(process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO || '919999999999');

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      await testFn();
      toast({
        title: 'Test Successful',
        description: `${testName} completed without errors.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error.message || `An error occurred during ${testName}.`,
      });
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testSubscription = () => {
    return handleSubscription({
      customerName: 'Test Subscriber',
      customerPhoneNumber: process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO || '919999999999',
    });
  };

  const testWhatsapp = async () => {
    const res = await fetch('/api/whatsapp/send-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: whatsappTestNumber }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to send WhatsApp message.');
    }
  };

  const testPayment = async () => {
    const orderId = `WB-TEST-${Date.now()}`;
    const res = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        amount: 1,
        customerName: 'Test Customer',
        customerPhone: '9999999999',
        returnUrl: `${window.location.origin}/order-confirmation`,
        items: [{ name: 'Test Item', quantity: 1, price: 1 }],
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to create payment link.');
    }

    const data = await res.json();

    localStorage.setItem(`order_${orderId}`, JSON.stringify({
      orderId,
      customerName: 'Test Customer',
      customerPhoneNumber: '919999999999',
      customerAddress: '123 Test Street, Test City, 12345',
      productName: 'Test Product',
      quantity: 1,
      totalCost: 1,
      advanceAmount: 1,
    }));

    if (data.payment_session_id && (window as any).Cashfree) {
      const cashfree = (window as any).Cashfree({ mode: data.env === 'PRODUCTION' ? 'production' : 'sandbox' });
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/order-confirmation?order_id={order_id}`
      });
    } else {
      throw new Error("Cashfree SDK not available or payment session ID missing.");
    }
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://127.0.0.1:8787';

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <Activity className="h-5 w-5 text-[#137fec]" />
        <h3 className="text-lg font-semibold">System Diagnostics</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Test */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">WhatsApp Integration</h3>
          </div>
          <p className="text-sm text-muted-foreground">Send a test hello_world template message.</p>
          <div className="flex gap-2">
            <Input
              value={whatsappTestNumber}
              onChange={(e) => setWhatsappTestNumber(e.target.value)}
              placeholder="919876543210"
              className="glass-input h-9"
            />
            <Button onClick={() => runTest('WhatsApp Test', testWhatsapp)} disabled={loading['WhatsApp Test'] || !whatsappTestNumber} size="sm" className="bg-[#137fec] text-white hover:bg-[#0d6edb]">
              {loading['WhatsApp Test'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </div>
        </div>

        {/* Payment Test */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Payment Gateway</h3>
          </div>
          <p className="text-sm text-muted-foreground">Initiate a mock payment of ₹1.00.</p>
          <Button onClick={() => runTest('Payment Test', testPayment)} disabled={loading['Payment Test']} size="sm" className="w-full glass-input hover:bg-white/10">
            {loading['Payment Test'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Payment Flow
          </Button>
        </div>

        {/* Subscription Test */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Link className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Subscription Flow</h3>
          </div>
          <p className="text-sm text-muted-foreground">Simulate new user subscription logic.</p>
          <Button onClick={() => runTest('Subscription Test', testSubscription)} disabled={loading['Subscription Test']} size="sm" className="w-full glass-input hover:bg-white/10">
            {loading['Subscription Test'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Logic
          </Button>
        </div>

        {/* Worker API Tests */}
        <div className="glass-card rounded-xl p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Worker APIs</h3>
          </div>
          <p className="text-sm text-muted-foreground">Test connectivity to backend worker endpoints.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => runTest('Products API', async () => {
              const res = await fetch(`${apiBaseUrl}/products`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (!Array.isArray(data)) throw new Error('Expected array');
            })} disabled={loading['Products API']} className="glass-input hover:bg-white/10 h-auto py-3">
              {loading['Products API'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Products
            </Button>

            <Button variant="outline" onClick={() => runTest('Categories API', async () => {
              const res = await fetch(`${apiBaseUrl}/categories`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (!Array.isArray(data)) throw new Error('Expected array');
            })} disabled={loading['Categories API']} className="glass-input hover:bg-white/10 h-auto py-3">
              {loading['Categories API'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Categories
            </Button>

            <Button variant="outline" onClick={() => runTest('Site Images API', async () => {
              const res = await fetch(`${apiBaseUrl}/site-images`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (!Array.isArray(data)) throw new Error('Expected array');
            })} disabled={loading['Site Images API']} className="glass-input hover:bg-white/10 h-auto py-3">
              {loading['Site Images API'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Site Images
            </Button>

            <Button variant="outline" onClick={() => runTest('Blogs API', async () => {
              const res = await fetch(`${apiBaseUrl}/blogs`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              if (!Array.isArray(data)) throw new Error('Expected array');
            })} disabled={loading['Blogs API']} className="glass-input hover:bg-white/10 h-auto py-3">
              {loading['Blogs API'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Blogs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
