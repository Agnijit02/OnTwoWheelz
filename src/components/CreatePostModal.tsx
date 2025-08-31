import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  X,
  MapPin,
  Loader2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const userDisplayName = profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || "Rider";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > 5) {
      toast({
        title: "Too many files",
        description: "You can only upload up to 5 images per post.",
        variant: "destructive"
      });
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files.",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes (max 10MB per file)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each image must be smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post.",
        variant: "destructive"
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image for your post.",
        variant: "destructive"
      });
      return;
    }

    if (!caption.trim()) {
      toast({
        title: "Caption required",
        description: "Please add a caption to your post.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload images
      const uploadPromises = selectedFiles.map(file =>
        storageService.uploadPostImage(file, user.id)
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Check for upload errors
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} image(s)`);
      }

      // Get successful image URLs
      const imageUrls = uploadResults
        .filter(result => result.url)
        .map(result => result.url);

      // Create the post
      await authService.createPost(user.id, {
        caption: caption.trim(),
        location: location.trim() || undefined,
        images: imageUrls,
        is_public: true
      });

      // Reset form
      setCaption('');
      setLocation('');
      setSelectedFiles([]);
      setImagePreviews([]);

      onPostCreated();

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setCaption('');
      setLocation('');
      setSelectedFiles([]);
      setImagePreviews([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2 text-primary" />
            Share Your Adventure
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{userDisplayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{userDisplayName}</p>
              <p className="text-xs text-muted-foreground">Share your adventure</p>
            </div>
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="caption" className="text-sm font-medium">
              Caption *
            </Label>
            <Textarea
              id="caption"
              placeholder="Tell us about your adventure..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 min-h-[80px]"
              disabled={isUploading}
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium">
              Location (optional)
            </Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Where did this adventure take place?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-sm font-medium">
              Photos * (max 5 images, 10MB each)
            </Label>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imagePreviews.map((preview, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-2">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length < 5 && (
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFiles.length === 0 ? 'Add Photos' : `Add More (${selectedFiles.length}/5)`}
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || selectedFiles.length === 0 || !caption.trim()}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Share Adventure
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
