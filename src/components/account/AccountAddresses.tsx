"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Trash, Edit2, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { LayoutGroup, motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useToast } from '@/hooks/use-toast';

interface Address {
    id: string;
    label: string; // Home, Work, etc.
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
}

export function AccountAddresses() {
    const { customer, updateCustomer } = useCustomerAuth();
    const [addresses, setAddresses] = useState<Address[]>(() => {
        if (customer?.address_json) {
            try {
                const parsed = JSON.parse(customer.address_json);
                // Ensure it's an array
                return Array.isArray(parsed) ? parsed : [];
            } catch { return []; }
        }
        return [];
    });
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState<Address>({
        id: '',
        label: 'Home',
        line1: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
    });

    const handleSave = async () => {
        // Basic validation
        if (!formData.line1 || !formData.pincode || !formData.city) {
            toast({ variant: 'destructive', title: "Missing Fields", description: "Please fill in all required fields." });
            return;
        }

        let updatedAddresses = [...addresses];

        if (editingId) {
            updatedAddresses = updatedAddresses.map(a => a.id === editingId ? { ...formData, id: editingId } : a);
        } else {
            updatedAddresses.push({ ...formData, id: Math.random().toString(36).substr(2, 9) });
        }

        // If set as default, unset others
        if (formData.isDefault) {
            updatedAddresses = updatedAddresses.map(a =>
                a.id === (editingId || updatedAddresses[updatedAddresses.length - 1].id)
                    ? { ...a, isDefault: true }
                    : { ...a, isDefault: false }
            );
        }

        // Optimistic update
        setAddresses(updatedAddresses);
        setIsOpen(false);
        setEditingId(null);
        resetForm();

        try {
            // Sync with server
            await updateCustomer({
                phone: customer?.phone || '',
                address_json: JSON.stringify(updatedAddresses)
            }, 'address');

            toast({ title: "Address Saved", description: "Your address book has been updated." });

        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not sync with server." });
            // Revert? For now, we assume success or user retries.
        }
    };

    const handleDelete = async (id: string) => {
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        await updateCustomer({
            phone: customer?.phone || '',
            address_json: JSON.stringify(updated)
        }, 'address');
        toast({ title: "Address Deleted" });
    };

    const resetForm = () => {
        setFormData({
            id: '',
            label: 'Home',
            line1: '',
            city: '',
            state: '',
            pincode: '',
            isDefault: false
        });
    }

    const openEdit = (addr: Address) => {
        setFormData(addr);
        setEditingId(addr.id);
        setIsOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-headline">My Addresses</h2>
                    <p className="text-muted-foreground">Manage your shipping addresses for faster checkout.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) { setEditingId(null); resetForm(); } }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Address
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Label</Label>
                                <Input value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="col-span-3" placeholder="Home, Work, etc." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Address</Label>
                                <Textarea value={formData.line1} onChange={e => setFormData({ ...formData, line1: e.target.value })} className="col-span-3" placeholder="Street address, Flat No..." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">City</Label>
                                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Pincode</Label>
                                <Input value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} className="col-span-3" maxLength={6} />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <input type="checkbox" id="isDef" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="h-4 w-4" />
                                <Label htmlFor="isDef">Set as Default Address</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave}>Save Address</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No addresses saved yet.</p>
                    </div>
                )}
                <LayoutGroup>
                    {addresses.map((addr) => (
                        <motion.div layout key={addr.id}>
                            <Card className={`relative group ${addr.isDefault ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">{addr.label}</CardTitle>
                                            {addr.isDefault && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(addr)}><Edit2 className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(addr.id)}><Trash className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {addr.line1}<br />
                                        {addr.line2 && <>{addr.line2}<br /></>}
                                        {addr.city} - {addr.pincode}<br />
                                        {addr.state}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </LayoutGroup>
            </div>
        </div>
    );
}
