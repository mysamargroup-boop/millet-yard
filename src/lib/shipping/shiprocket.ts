
import { OrderData, ShipmentResponse, ShippingProvider } from './types';

export class ShiprocketProvider implements ShippingProvider {
    name = 'shiprocket';
    private token: string | null = null;
    private tokenExpiry: number = 0;

    private async getToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        const email = process.env.SHIPROCKET_EMAIL;
        const password = process.env.SHIPROCKET_PASSWORD;

        if (!email || !password) {
            throw new Error('Shiprocket credentials not configured');
        }

        const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Failed to authenticate with Shiprocket');
        }

        const data = await response.json();
        this.token = data.token;
        // Cache for 24 hours (usually valid for 10 days, but safer to refresh)
        this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

        return this.token;
    }

    async createOrder(orderData: OrderData): Promise<ShipmentResponse> {
        try {
            const token = await this.getToken();

            const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Failed to create order in Shiprocket',
                    rawResponse: data
                };
            }

            return {
                success: true,
                shipmentId: data.shipment_id,
                orderId: data.order_id,
                rawResponse: data
            };

        } catch (error: any) {
            console.error('Shiprocket create order error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async cancelOrder(orderId: string): Promise<boolean> {
        try {
            const token = await this.getToken();

            const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ids: [orderId] })
            });

            return response.ok;
        } catch (error) {
            console.error('Shiprocket cancel order error:', error);
            return false;
        }
    }

    getTrackingUrl(trackingId: string): string {
        return `https://shiprocket.co/tracking/${trackingId}`;
    }
}
