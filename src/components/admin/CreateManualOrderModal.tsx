'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingBag, User, Phone, MapPin, CreditCard, Activity } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sale_price: number;
  regular_price: number;
}

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateManualOrderModal({ isOpen, onClose, onSuccess }: CreateManualOrderModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ id: string; quantity: number }[]>([{ id: '', quantity: 1 }]);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING'
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const addItem = () => {
    setSelectedItems([...selectedItems, { id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const updateItem = (index: number, field: 'id' | 'quantity', value: string | number) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
      toast({ title: "Error", description: "Please fill in all required customer details", variant: "destructive" });
      return;
    }

    const items = selectedItems.filter(item => item.id && item.quantity > 0).map(item => {
      const p = products.find(prod => prod.id === item.id);
      return {
        id: item.id,
        name: p?.name || 'Product',
        quantity: item.quantity,
        price: p?.sale_price || p?.regular_price || 0
      };
    });

    if (items.length === 0) {
      toast({ title: "Error", description: "Please add at least one product", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const orderId = `MAN-${Date.now()}`;
      const payload = {
        orderId,
        ...formData,
        items,
        isAdmin: true, // This triggers the -SR suffix in the worker
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentStatus
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: "Success", description: "Manual order created successfully with -SR suffix" });
        onSuccess();
        onClose();
        // Reset form
        setSelectedItems([{ id: '', quantity: 1 }]);
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerAddress: '',
          paymentMethod: 'COD',
          paymentStatus: 'PENDING'
        });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111a22]/80 backdrop-blur-xl border border-border/10 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#137fec]" />
            Create Manual Order
          </DialogTitle>
          <DialogDescription>
            Create an order manually. Order ID will automatically get an '-SR' suffix.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Customer Name *
              </Label>
              <Input
                id="customerName"
                placeholder="Full Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Customer Phone *
              </Label>
              <Input
                id="customerPhone"
                placeholder="Phone Number (e.g. 91XXXXXXXXXX)"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Customer Email (Optional)
            </Label>
            <Input
              id="customerEmail"
              placeholder="Email (If empty, will use phone@domain)"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="glass-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Full Address *
            </Label>
            <Textarea
              id="customerAddress"
              placeholder="House No, Street, Landmark, City, State, Pincode"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              className="glass-input min-h-[80px]"
              required
            />
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment Method
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-border/10">
                  <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
                  <SelectItem value="PREPAID">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Payment Status
              </Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-border/10">
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Order Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {selectedItems.map((item, index) => (
              <div key={index} className="flex gap-3 items-end p-3 rounded-lg bg-white/5 border border-border/5">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">Product</Label>
                  <Select
                    value={item.id}
                    onValueChange={(value) => updateItem(index, 'id', value)}
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-border/10 max-h-[200px]">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (₹{p.sale_price || p.regular_price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="glass-input"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => removeItem(index)}
                  disabled={selectedItems.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 border-t border-border/10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#137fec] hover:bg-[#137fec]/90" disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
