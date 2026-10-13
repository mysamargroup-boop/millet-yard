"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerAuth } from '@/lib/customer-auth';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Loader2 } from 'lucide-react';

export function AccountProfile() {
    const { customer, updateCustomer, isLoading } = useCustomerAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        email: customer?.email || ''
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateCustomer({
                phone: customer?.phone || '',
                name: formData.name,
                email: formData.email
            }, 'profile');

            toast({ title: "Profile Updated", description: "Your details have been saved successfully." });
            setIsEditing(false);
        } catch {
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not save changes. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: customer?.name || '',
            email: customer?.email || ''
        });
        setIsEditing(false);
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-2xl font-bold font-headline">My Profile</h2>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                                className="pl-9"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                className="pl-9"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={customer?.phone ? `+${customer.phone}` : ''}
                                disabled={true}
                                className="pl-9 bg-muted"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Phone number cannot be changed directly. Contact support for assistance.</p>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <p className="text-xs text-muted-foreground">Receive updates about your orders</p>
                            </div>
                            <Switch
                                checked={Notification.permission === 'granted'}
                                onCheckedChange={async (checked) => {
                                    if (checked) {
                                        const permission = await Notification.requestPermission();
                                        if (permission === 'granted') {
                                            // Permission granted
                                            setSaving(false); // trigger re-render hack if needed, or state update
                                            toast({ title: "Notifications Enabled", description: "You will now receive updates." });
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
