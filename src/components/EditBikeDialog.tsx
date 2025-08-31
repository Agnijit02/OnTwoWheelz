import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Camera } from "lucide-react";
import { storageService } from "@/lib/storage";
import type { UserBike } from "@/lib/supabase";

interface EditBikeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBikeUpdated: (bikeId: string, data: Partial<UserBike>) => Promise<void>;
  onBikeDeleted: (bikeId: string) => Promise<void>;
  initialData: UserBike;
}

export const EditBikeDialog = ({ isOpen, onOpenChange, onBikeUpdated, onBikeDeleted, initialData }: EditBikeDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    engine_size: '',
    engine_type: '',
    power: '',
    weight: '',
    fuel_capacity: '',
    modifications: [] as string[],
    mileage: '',
    purchase_date: '',
    is_primary: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newModification, setNewModification] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initialize form data when dialog opens or initial data changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        year: initialData.year?.toString() || '',
        color: initialData.color || '',
        engine_size: initialData.engine_size || '',
        engine_type: initialData.engine_type || '',
        power: initialData.power || '',
        weight: initialData.weight || '',
        fuel_capacity: initialData.fuel_capacity || '',
        modifications: initialData.modifications || [],
        mileage: initialData.mileage?.toString() || '',
        purchase_date: initialData.purchase_date || '',
        is_primary: initialData.is_primary || false
      });
      setImagePreview(initialData.image_url || null);
      setSelectedFile(null);
    }
  }, [isOpen, initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!storageService.isValidImage(file)) {
        alert('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }
      
      setSelectedFile(file);
      const previewUrl = storageService.createPreviewUrl(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const addModification = () => {
    if (newModification.trim() && !formData.modifications.includes(newModification.trim())) {
      setFormData({
        ...formData,
        modifications: [...formData.modifications, newModification.trim()]
      });
      setNewModification('');
    }
  };

  const removeModification = (modToRemove: string) => {
    setFormData({
      ...formData,
      modifications: formData.modifications.filter(mod => mod !== modToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = initialData.image_url;
      
      // Upload new image if selected
      if (selectedFile) {
        setUploadingImage(true);
        const uploadResult = await storageService.uploadBikeImage(selectedFile, user?.id || '');
        if (uploadResult.error) {
          alert(`Image upload failed: ${uploadResult.error}`);
          return;
        }
        imageUrl = uploadResult.url;
        setUploadingImage(false);
      } else if (imagePreview === null) {
        // User removed the image
        imageUrl = null;
      }

      // Prepare bike data
      const bikeData: Partial<UserBike> = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        color: formData.color || undefined,
        engine_size: formData.engine_size || undefined,
        engine_type: formData.engine_type || undefined,
        power: formData.power || undefined,
        weight: formData.weight || undefined,
        fuel_capacity: formData.fuel_capacity || undefined,
        modifications: formData.modifications.length > 0 ? formData.modifications : undefined,
        mileage: formData.mileage ? parseFloat(formData.mileage) : undefined,
        purchase_date: formData.purchase_date || undefined,
        is_primary: formData.is_primary,
        image_url: imageUrl || undefined
      };

      await onBikeUpdated(initialData.id, bikeData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating bike:', error);
      alert('Failed to update bike. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bike? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onBikeDeleted(initialData.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting bike:', error);
      alert('Failed to delete bike. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bike</DialogTitle>
          <DialogDescription>
            Update your bike details and specifications.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Bike Photo</Label>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Bike preview" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bike-image-edit"
                  />
                  <Label 
                    htmlFor="bike-image-edit" 
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bike-name-edit">Bike Nickname *</Label>
                <Input 
                  id="bike-name-edit" 
                  placeholder="e.g., The Wanderer" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Primary Bike</Label>
                <Select value={formData.is_primary.toString()} onValueChange={(value) => setFormData({ ...formData, is_primary: value === 'true' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bike-brand-edit">Brand *</Label>
                <Input 
                  id="bike-brand-edit" 
                  placeholder="e.g., Royal Enfield" 
                  value={formData.brand} 
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bike-model-edit">Model *</Label>
                <Input 
                  id="bike-model-edit" 
                  placeholder="e.g., Himalayan" 
                  value={formData.model} 
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bike-year-edit">Year</Label>
                <Input 
                  id="bike-year-edit" 
                  type="number"
                  placeholder="2024" 
                  value={formData.year} 
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bike-color-edit">Color</Label>
                <Input 
                  id="bike-color-edit" 
                  placeholder="e.g., Granite Black" 
                  value={formData.color} 
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bike-mileage-edit">Mileage (km)</Label>
                <Input 
                  id="bike-mileage-edit" 
                  type="number"
                  placeholder="15000" 
                  value={formData.mileage} 
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} 
                />
              </div>
            </div>

            {/* Engine Specs */}
            <div className="space-y-4">
              <h4 className="font-semibold">Engine Specifications</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="engine-size-edit">Engine Size</Label>
                  <Input 
                    id="engine-size-edit" 
                    placeholder="e.g., 411cc" 
                    value={formData.engine_size} 
                    onChange={(e) => setFormData({ ...formData, engine_size: e.target.value })} 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="engine-type-edit">Engine Type</Label>
                  <Input 
                    id="engine-type-edit" 
                    placeholder="e.g., Single Cylinder" 
                    value={formData.engine_type} 
                    onChange={(e) => setFormData({ ...formData, engine_type: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="power-edit">Power</Label>
                  <Input 
                    id="power-edit" 
                    placeholder="e.g., 24.3 HP" 
                    value={formData.power} 
                    onChange={(e) => setFormData({ ...formData, power: e.target.value })} 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weight-edit">Weight</Label>
                  <Input 
                    id="weight-edit" 
                    placeholder="e.g., 199 kg" 
                    value={formData.weight} 
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fuel-capacity-edit">Fuel Capacity</Label>
                  <Input 
                    id="fuel-capacity-edit" 
                    placeholder="e.g., 15L" 
                    value={formData.fuel_capacity} 
                    onChange={(e) => setFormData({ ...formData, fuel_capacity: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {/* Modifications */}
            <div className="space-y-4">
              <h4 className="font-semibold">Modifications & Upgrades</h4>
              <div className="flex space-x-2">
                <Input 
                  placeholder="e.g., Crash guards, LED headlight" 
                  value={newModification} 
                  onChange={(e) => setNewModification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addModification())}
                />
                <Button type="button" onClick={addModification} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.modifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.modifications.map((mod, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {mod}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeModification(mod)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="purchase-date-edit">Purchase Date</Label>
              <Input 
                id="purchase-date-edit" 
                type="date"
                value={formData.purchase_date} 
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} 
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="sm:mr-auto"
            >
              {isDeleting ? 'Deleting...' : 'Delete Bike'}
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || uploadingImage}>
                {uploadingImage ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
