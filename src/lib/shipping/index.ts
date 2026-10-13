
import { ShippingProvider } from './types';
import { ShiprocketProvider } from './shiprocket';

export * from './types';

class ManualProvider implements ShippingProvider {
    name = 'manual';

    async createOrder(orderData: any): Promise<any> {
        return { success: true, message: 'Manual mode: Order not pushed to any provider' };
    }

    async cancelOrder(orderId: string): Promise<boolean> {
        return true;
    }

    getTrackingUrl(trackingId: string): string {
        return '#'; // No specific tracking URL needed
    }
}

export function getShippingProvider(): ShippingProvider {
    const providerName = process.env.SHIPPING_PROVIDER || 'manual';

    switch (providerName.toLowerCase()) {
        case 'shiprocket':
            return new ShiprocketProvider();
        // Case for 'bigship' or others in future
        case 'manual':
        default:
            return new ManualProvider();
    }
}
