"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, MapPin, Edit2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API } from "@/config/api";
import { useCustomerAuth } from "@/lib/customer-auth";

export interface Address {
    id: string;
    full_name: string;
    phone: string;
    address_line: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    is_default?: boolean;
}

export default function AddressBook() {
    const { customer } = useCustomerAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState<Address>({
        id: "",
        full_name: "",
        phone: "",
        address_line: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
    });

    useEffect(() => {
        if (customer?.phone) {
            fetchAddresses();
        }
    }, [customer]);

    const fetchAddresses = async () => {
        try {
            const res = await fetch(`${API.ADDRESSES}?phone=${customer?.phone}`);
            if (res.ok) {
                const data = await res.json();
                setAddresses(data.addresses || []);
            }
        } catch (error) {
            console.error("Failed to fetch addresses");
        } finally {
            setLoading(false);
        }
    };

    const saveAddress = async (address: Partial<Address>) => {
        try {
            const res = await fetch(`${API.ADDRESSES}?phone=${customer?.phone}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(address),
            });


            if (!res.ok) throw new Error("Failed to save");

            fetchAddresses();
            toast({
                title: "Success",
                description: "Address saved successfully.",
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save address.",
            });
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            const res = await fetch(`${API.ADDRESSES}?phone=${customer?.phone}&id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");

            setAddresses(addresses.filter(a => a.id !== id));
            toast({ title: "Deleted", description: "Address removed." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete address." });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // For simplicity, we currently treat edit as "remove and add" or we could add PUT
        // But the Worker handler currently handles POST as insert. 
        // Let's just do save for now.
        await saveAddress(formData);
        setEditingId(null);
        setFormData({ id: "", full_name: "", phone: "", address_line: "", area: "", city: "", state: "", pincode: "" });
    };

    const handleEdit = (addr: Address) => {
        setFormData(addr);
        setEditingId(addr.id);
        setIsOpen(true);
    };


    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        await deleteAddress(id);
    };

    const handleSetDefault = async (addr: Address) => {
        await saveAddress({ ...addr, is_default: true });
    };

    if (loading) return <div>Loading addresses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setFormData({ id: "", full_name: "", phone: "", address_line: "", area: "", city: "", state: "", pincode: "" });
                    }
                }}>

                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[24px] sm:rounded-[32px] max-w-[95vw] sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Address" : "Add New Address"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (for Courier)</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="919876543210"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address_line">Address Line</Label>
                                <Textarea
                                    id="address_line"
                                    value={formData.address_line}
                                    onChange={e => setFormData({ ...formData, address_line: e.target.value })}
                                    placeholder="Flat No, Building, Street..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="area">Area / Locality</Label>
                                <Input
                                    id="area"
                                    value={formData.area}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    placeholder="Sector 12, Phase 2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Bhopal"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="MP"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode</Label>
                                <Input
                                    id="pincode"
                                    value={formData.pincode}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                    placeholder="462001"
                                    required
                                    maxLength={6}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit">Save Address</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {addresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No saved addresses found.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {addresses.map((addr) => (
                        <Card key={addr.id} className={`relative ${addr.is_default ? "border-primary bg-primary/5" : ""}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {addr.full_name}
                                    </div>
                                    {addr.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Default</span>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{addr.address_line}{addr.area ? `, ${addr.area}` : ""}</p>
                                <p className="text-xs text-muted-foreground mb-1">
                                    {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-xs text-muted-foreground mb-3">Phone: {addr.phone}</p>

                                <div className="flex gap-2 justify-end">
                                    {!addr.is_default && (
                                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr)}>
                                            Set Default
                                        </Button>
                                    )}
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(addr)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(addr.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
