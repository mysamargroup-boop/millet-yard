
// Shipping Provider Interface
export interface OrderData {
    orderId: string;
    orderDate: string;
    pickupLocation: string;
    channelId?: string;
    comment?: string;
    billingCustomerName: string;
    billingLastname: string;
    billingAddress: string;
    billingAddress2?: string;
    billingCity: string;
    billingPincode: string;
    billingState: string;
    billingCountry: string;
    billingEmail: string;
    billingPhone: string;
    shippingIsBilling: boolean;
    shippingCustomerName?: string;
    shippingLastname?: string;
    shippingAddress?: string;
    shippingAddress2?: string;
    shippingCity?: string;
    shippingPincode?: string;
    shippingCountry?: string;
    shippingState?: string;
    shippingEmail?: string;
    shippingPhone?: string;
    orderItems: OrderItem[];
    paymentMethod: 'Prepaid' | 'COD';
    shippingCharges?: number;
    giftWrapCharges?: number;
    transactionCharges?: number;
    totalDiscount?: number;
    subTotal: number;
    length: number;
    breadth: number;
    height: number;
    weight: number;
}

export interface OrderItem {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
}

export interface ShipmentResponse {
    success: boolean;
    shipmentId?: string;
    orderId?: string;
    courierName?: string;
    awbCode?: string;
    error?: string;
    rawResponse?: any;
}

export interface ShippingProvider {
    name: string;
    createOrder(orderData: OrderData): Promise<ShipmentResponse>;
    cancelOrder(orderId: string): Promise<boolean>;
    getTrackingUrl(trackingId: string): string;
}
