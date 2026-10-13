"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit, MoveUp, MoveDown, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSlidingCard, updateSlidingCard, deleteSlidingCard, getSlidingCards } from "@/lib/actions";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface SlidingCard {
  id: string;
  title: string;
  description: string;
  image_url: string;
  image_hint?: string;
  link_url?: string;
  order_num: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SlidingCardsPage() {
  const [cards, setCards] = useState<SlidingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<SlidingCard | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [createState, createAction] = useFormState(createSlidingCard, undefined);
  const [updateState, updateAction] = useFormState(
    (prevState: any, formData: FormData) => {
      if (editingCard) {
        return updateSlidingCard(editingCard.id, prevState, formData);
      }
      return prevState;
    },
    undefined
  );

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getSlidingCards();
      setCards(data || []);
    } catch (error) {
      console.error("Failed to load sliding cards:", error);
      toast({
        title: "Error",
        description: "Failed to load sliding cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card: SlidingCard) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingCard(null);
    setShowForm(true);
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this sliding card?")) return;

    try {
      const formData = new FormData();
      formData.append("id", cardId);
      await deleteSlidingCard(formData);
      await loadCards();
      toast({
        title: "Success",
        description: "Sliding card deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sliding card",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (card: SlidingCard) => {
    try {
      const formData = new FormData();
      formData.append("id", card.id);
      formData.append("active", (!card.active).toString());
      await updateSlidingCard(card.id, undefined, formData);
      await loadCards();
      toast({
        title: "Success",
        description: `Sliding card ${card.active ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sliding card",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (cardId: string, direction: 'up' | 'down') => {
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (
      (direction === 'up' && cardIndex === 0) ||
      (direction === 'down' && cardIndex === cards.length - 1)
    ) return;

    const newCards = [...cards];
    const targetIndex = direction === 'up' ? cardIndex - 1 : cardIndex + 1;

    // Swap order numbers
    const tempOrder = newCards[cardIndex].order_num;
    newCards[cardIndex].order_num = newCards[targetIndex].order_num;
    newCards[targetIndex].order_num = tempOrder;

    // Update both cards
    try {
      await Promise.all([
        updateSlidingCard(newCards[cardIndex].id, undefined, createFormData(newCards[cardIndex])),
        updateSlidingCard(newCards[targetIndex].id, undefined, createFormData(newCards[targetIndex]))
      ]);
      await loadCards();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder sliding cards",
        variant: "destructive",
      });
    }
  };

  const createFormData = (card: SlidingCard) => {
    const formData = new FormData();
    formData.append("title", card.title);
    formData.append("description", card.description || "");
    formData.append("image_url", card.image_url);
    formData.append("image_hint", card.image_hint || "");
    formData.append("link_url", card.link_url || "");
    formData.append("order_num", card.order_num.toString());
    formData.append("active", card.active.toString());
    return formData;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sliding Cards</h1>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Card
        </Button>
      </div>

      {/* Form Modal/Card */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingCard ? "Edit Sliding Card" : "Create New Sliding Card"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={editingCard ? updateAction : createAction}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingCard?.id || ""} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingCard?.title || ""}
                    placeholder="Enter card title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="order_num">Order</Label>
                  <Input
                    id="order_num"
                    name="order_num"
                    type="number"
                    defaultValue={editingCard?.order_num || 0}
                    placeholder="Display order"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingCard?.description || ""}
                  placeholder="Enter card description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_url">Image URL *</Label>
                  <div className="space-y-2">
                    <Input
                      id="image_url"
                      name="image_url"
                      defaultValue={editingCard?.image_url || ""}
                      placeholder="Enter image URL"
                      required
                    />
                    <div className="text-sm text-muted-foreground">Or upload via Cloudinary:</div>
                    <CldUploadWidget
                      onSuccess={(result) => {
                        const input = document.querySelector('input[name="image_url"]') as HTMLInputElement;
                        if (input && typeof result.info === 'object' && result.info !== null && 'secure_url' in result.info) {
                          input.value = result.info.secure_url;
                        }
                      }}
                      uploadPreset="sliding-cards"
                    >
                      {({ open }) => (
                        <Button type="button" variant="outline" onClick={() => open()}>
                          Upload Image
                        </Button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>

                <div>
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    name="link_url"
                    defaultValue={editingCard?.link_url || ""}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_hint">Image Hint (for AI)</Label>
                <Input
                  id="image_hint"
                  name="image_hint"
                  defaultValue={editingCard?.image_hint || ""}
                  placeholder="AI image generation hint"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  name="active"
                  defaultChecked={editingCard?.active ?? true}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCard ? "Update Card" : "Create Card"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        {cards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No sliding cards found. Create your first card!</p>
            </CardContent>
          </Card>
        ) : (
          cards
            .sort((a, b) => a.order_num - b.order_num)
            .map((card) => (
              <Card key={card.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Image Preview */}
                    <div className="relative w-32 h-40 flex-shrink-0">
                      <Image
                        src={card.image_url}
                        alt={card.title}
                        fill
                        className="object-cover rounded-lg"
                        sizes="128px"
                      />
                      {!card.active && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <EyeOff className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{card.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={card.active ? "default" : "secondary"}>
                              {card.active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">Order: {card.order_num}</Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(card)}
                          >
                            {card.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorder(card.id, 'up')}
                            disabled={cards[0].id === card.id}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorder(card.id, 'down')}
                            disabled={cards[cards.length - 1].id === card.id}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(card.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {card.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {card.description}
                        </p>
                      )}

                      {card.link_url && (
                        <p className="text-sm text-blue-600 truncate">
                          Link: {card.link_url}
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(card.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
