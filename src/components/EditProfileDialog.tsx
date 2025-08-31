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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Camera } from "lucide-react";
import { storageService } from "@/lib/storage";
import type { UserProfile } from "@/lib/supabase";

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProfileUpdated: (data: Partial<UserProfile>) => Promise<void>;
  initialData: {
    display_name?: string;
    bio?: string;
    location?: string;
    experience?: string;
    favorite_type?: string;
    website_url?: string;
    avatar_url?: string;
  };
}

export const EditProfileDialog = ({ isOpen, onOpenChange, onProfileUpdated, initialData }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    experience: '',
    favorite_type: '',
    website_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initialize form data when dialog opens or initial data changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        display_name: initialData.display_name || '',
        bio: initialData.bio || '',
        location: initialData.location || '',
        experience: initialData.experience || '',
        favorite_type: initialData.favorite_type || '',
        website_url: initialData.website_url || ''
      });
      setImagePreview(initialData.avatar_url || null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let avatarUrl = initialData.avatar_url;
      
      // Upload new avatar if selected
      if (selectedFile) {
        setUploadingImage(true);
        const uploadResult = await storageService.uploadAvatar(selectedFile, user?.id || '');
        if (uploadResult.error) {
          alert(`Avatar upload failed: ${uploadResult.error}`);
          return;
        }
        avatarUrl = uploadResult.url;
        setUploadingImage(false);
      } else if (imagePreview === null) {
        // User removed the avatar
        avatarUrl = null;
      }

      // Prepare profile data
      const profileData: Partial<UserProfile> = {
        display_name: formData.display_name,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        experience: formData.experience || undefined,
        favorite_type: formData.favorite_type || undefined,
        website_url: formData.website_url || undefined,
        avatar_url: avatarUrl || undefined
      };

      await onProfileUpdated(profileData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and avatar.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={imagePreview || ''} />
                    <AvatarFallback className="text-lg">
                      {formData.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label 
                    htmlFor="avatar-upload" 
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WebP. Max 10MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="display-name">Display Name *</Label>
                <Input 
                  id="display-name" 
                  placeholder="Your display name" 
                  value={formData.display_name} 
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} 
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="e.g., San Francisco, CA" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                placeholder="Tell others about yourself and your riding passion..."
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                type="url"
                placeholder="https://yourwebsite.com" 
                value={formData.website_url} 
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} 
              />
            </div>

            {/* Riding Info */}
            <div className="space-y-4">
              <h4 className="font-semibold">Riding Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Experience Level</Label>
                  <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (Less than 1 year)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1-5 years)</SelectItem>
                      <SelectItem value="experienced">Experienced (5-10 years)</SelectItem>
                      <SelectItem value="expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Favorite Riding Type</Label>
                  <Select value={formData.favorite_type} onValueChange={(value) => setFormData({ ...formData, favorite_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select riding type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="touring">Adventure Touring</SelectItem>
                      <SelectItem value="offroad">Off-Road Adventure</SelectItem>
                      <SelectItem value="scenic">Scenic Touring</SelectItem>
                      <SelectItem value="track">Track Riding</SelectItem>
                      <SelectItem value="urban">Urban Explorer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || uploadingImage}>
              {uploadingImage ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
