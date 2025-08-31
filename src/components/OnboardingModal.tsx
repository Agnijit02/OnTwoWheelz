import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bike, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import type { UserProfileData } from "@/lib/auth";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userId: string;
  userEmail?: string;
  userName?: string;
}

interface OnboardingData {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  bikeBrand: string;
  bikeModel: string;
  bikeYear: string;
  experience: string;
  favoriteType: string;
}

const OnboardingModal = ({ isOpen, onComplete, userId, userEmail, userName }: OnboardingModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    displayName: userName || '',
    username: '',
    bio: '',
    location: '',
    bikeBrand: '',
    bikeModel: '',
    bikeYear: '',
    experience: '',
    favoriteType: ''
  });

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName || !formData.username) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and choose a username.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user profile
      await authService.createUserProfile(userId, {
        username: formData.username,
        display_name: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        experience: formData.experience,
        favorite_type: formData.favoriteType,
      } as UserProfileData);

      // Add bike if provided
      if (formData.bikeBrand && formData.bikeModel) {
        await authService.upsertUserBike(userId, {
          name: 'My Bike',
          brand: formData.bikeBrand,
          model: formData.bikeModel,
          year: formData.bikeYear ? parseInt(formData.bikeYear) : undefined,
          is_primary: true,
        });
      }
      
      toast({
        title: "Welcome to the Adventure!",
        description: "Your rider profile has been created successfully.",
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        title: "Profile Creation Failed",
        description: error.message || "An error occurred while creating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Your Rider Profile</DialogTitle>
          <DialogDescription>
            Tell us about yourself and your motorcycle to personalize your adventure experience.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name *</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your adventure name"
              value={formData.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              type="text"
              placeholder="@username (unique)"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              required
            />
            <p className="text-xs text-muted-foreground">This will be part of your profile URL: /profile/{formData.username}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              placeholder="Where do you ride?"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bikeBrand">Motorcycle Brand</Label>
            <Select onValueChange={(value) => handleInputChange("bikeBrand", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your bike brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bmw">BMW</SelectItem>
                <SelectItem value="ktm">KTM</SelectItem>
                <SelectItem value="honda">Honda</SelectItem>
                <SelectItem value="yamaha">Yamaha</SelectItem>
                <SelectItem value="ducati">Ducati</SelectItem>
                <SelectItem value="triumph">Triumph</SelectItem>
                <SelectItem value="harley">Harley Davidson</SelectItem>
                <SelectItem value="kawasaki">Kawasaki</SelectItem>
                <SelectItem value="suzuki">Suzuki</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bikeModel">Model</Label>
              <Input
                id="bikeModel"
                placeholder="GS 1250"
                value={formData.bikeModel}
                onChange={(e) => handleInputChange("bikeModel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bikeYear">Year</Label>
              <Input
                id="bikeYear"
                placeholder="2024"
                value={formData.bikeYear}
                onChange={(e) => handleInputChange("bikeYear", e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience">Riding Experience</Label>
            <Select onValueChange={(value) => handleInputChange("experience", value)}>
              <SelectTrigger>
                <SelectValue placeholder="How long have you been riding?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Less than 1 year</SelectItem>
                <SelectItem value="intermediate">1-5 years</SelectItem>
                <SelectItem value="experienced">5-10 years</SelectItem>
                <SelectItem value="expert">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="favoriteType">Favorite Riding Type</Label>
            <Select onValueChange={(value) => handleInputChange("favoriteType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="What's your preferred adventure?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="touring">Long Distance Touring</SelectItem>
                <SelectItem value="offroad">Off-Road Adventure</SelectItem>
                <SelectItem value="scenic">Scenic Routes</SelectItem>
                <SelectItem value="track">Track Days</SelectItem>
                <SelectItem value="urban">Urban Exploration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your riding adventures..."
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              rows={3}
            />
          </div>
          
          <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Profile..." : "Start Your Adventure"}
            <Bike className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
