// src/pages/AddBikeDialog.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserBike } from "@/lib/supabase";

interface AddBikeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBikeAdded: (data: Partial<UserBike>) => Promise<void>;
}

export const AddBikeDialog = ({ isOpen, onOpenChange, onBikeAdded }: AddBikeDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onBikeAdded(formData);
    // Reset form for next time
    setFormData({ name: '', brand: '', model: '' });
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Bike</DialogTitle>
          <DialogDescription>
            Enter the details of your bike to add it to your garage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="bike-name">Bike Nickname</Label>
              <Input id="bike-name" placeholder="e.g., The Wanderer" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bike-brand">Brand</Label>
              <Input id="bike-brand" placeholder="e.g., Royal Enfield" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bike-model">Model</Label>
              <Input id="bike-model" placeholder="e.g., Himalayan" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Bike'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};