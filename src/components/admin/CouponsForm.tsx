
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCoupon, deleteCoupon, toggleCouponStatus, toggleCouponVisibility, updateCoupon } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { Coupon } from '@/lib/types';
import { Trash2, Loader2, Edit, TicketPercent, Save, X, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils'; // Assuming cn is available

const initialState = {
  message: null,
  errors: {},
  success: false,
};

function SubmitButton({ isEditing, onCancel }: { isEditing: boolean, onCancel?: () => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={pending} className="bg-[#137fec] hover:bg-[#0d6edb] text-white">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Coupon' : 'Create Coupon')}
      </Button>
      {isEditing && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending} className="border-white/10 hover:bg-white/5">
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      )}
    </div>
  );
}

export default function CouponsForm({ coupons }: { coupons: Coupon[] }) {
  const [state, formAction] = useActionState(createCoupon, initialState);
  const [updateState, updateFormAction] = useActionState(updateCoupon, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [currentType, setCurrentType] = useState('percent');
  const [currentValue, setCurrentValue] = useState<number | string>('');
  const [showOnOffers, setShowOnOffers] = useState(false);

  useEffect(() => {
    const formState = isEditing ? updateState : state;
    if (formState?.success) {
      toast({ title: "Success", description: `Coupon ${isEditing ? 'updated' : 'created'} successfully.` });
      handleCancelEdit();
    } else if (formState?.message) {
      toast({ title: "Error", description: formState.message, variant: "destructive" });
    }
  }, [state, updateState, isEditing, toast]);

  const handleDelete = async (code: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      const result = await deleteCoupon(code);
      if (result.success) {
        toast({ title: "Success", description: "Coupon deleted." });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    }
  };

  const handleToggle = async (code: string) => {
    const result = await toggleCouponStatus(code);
    if (result.success) {
      toast({ title: "Success", description: "Coupon status updated." });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleVisibilityToggle = async (code: string) => {
    const result = await toggleCouponVisibility(code);
    if (result.success) {
      toast({ title: "Success", description: "Coupon visibility updated." });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };


  const handleEdit = (coupon: Coupon) => {
    setIsEditing(coupon.code);
    setCurrentCode(coupon.code);
    setCurrentType(coupon.type);
    setCurrentValue(coupon.value);
    setShowOnOffers(coupon.show_on_offers_page || false);
    // Scroll to form
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setCurrentCode('');
    setCurrentType('percent');
    setCurrentValue('');
    setShowOnOffers(false);
    formRef.current?.reset();
  }

  const action = isEditing ? updateFormAction : formAction;

  return (
    <div className="grid gap-8">
      {/* Create/Edit Form */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-[#137fec]/20 flex items-center justify-center text-[#137fec]">
            {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? `Edit Coupon: ${isEditing}` : 'Create New Coupon'}</h2>
            <p className="text-sm text-muted-foreground">{isEditing ? 'Update coupon details below' : 'Add a new discount code for your store'}</p>
          </div>
        </div>

        <form ref={formRef} action={action} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <input type="hidden" name="originalCode" value={isEditing || ''} />

            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="SUMMER25"
                required
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value.toUpperCase())}
                className="font-mono glass-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Discount Type</Label>
              <Select name="type" value={currentType} onValueChange={(value) => setCurrentType(value as 'percent' | 'flat')}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Discount Value</Label>
              <div className="relative">
                <Input
                  id="value"
                  name="value"
                  type="number"
                  placeholder="10"
                  required
                  min="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="glass-input pr-8"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                  {currentType === 'percent' ? '%' : '₹'}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 flex flex-col justify-center space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show_on_offers_page" className="cursor-pointer">Public Offer</Label>
                <Switch id="show_on_offers_page" name="show_on_offers_page" checked={showOnOffers} onCheckedChange={setShowOnOffers} />
              </div>
              <p className="text-[10px] text-muted-foreground">If enabled, this coupon will be shown on the offers page.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <SubmitButton isEditing={!!isEditing} onCancel={handleCancelEdit} />
            {state?.errors?.code && <p className="text-red-500 text-sm">{state.errors.code}</p>}
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5 text-[#137fec]" />
            <h3 className="font-semibold text-lg">Active Coupons</h3>
          </div>
          <span className="text-sm text-muted-foreground">{coupons.length} coupons found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-left">
                <th className="p-4 font-medium text-muted-foreground">Code</th>
                <th className="p-4 font-medium text-muted-foreground">Discount</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Visibility</th>
                <th className="p-4 font-medium text-muted-foreground text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons have been created yet.</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-medium">{coupon.code}</div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        coupon.type === 'percent' ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                      )}>
                        {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.active}
                          onCheckedChange={() => handleToggle(coupon.code)}
                        />
                        <span className={cn("text-xs", coupon.active ? "text-green-400" : "text-muted-foreground")}>
                          {coupon.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.show_on_offers_page}
                          onCheckedChange={() => handleVisibilityToggle(coupon.code)}
                        />
                        <span className={cn("text-xs", coupon.show_on_offers_page ? "text-blue-400" : "text-muted-foreground")}>
                          {coupon.show_on_offers_page ? 'Public' : 'Hidden'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)} className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-400">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.code)} className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
