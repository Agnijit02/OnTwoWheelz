import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Mountain, User, Mail, Lock, Bike, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { authService } from "@/lib/auth";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bikeBrand: "",
    bikeModel: "",
    bikeYear: "",
    experience: "",
    favoriteType: "",
    bio: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await authService.signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        bikeBrand: formData.bikeBrand,
        bikeModel: formData.bikeModel,
        bikeYear: formData.bikeYear,
        experience: formData.experience,
        favoriteType: formData.favoriteType,
        bio: formData.bio
      });
      
      toast({
        title: "Welcome to the Adventure!",
        description: "Your rider profile has been created successfully.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <Card className="w-full max-w-lg card-bg border-border shadow-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Mountain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">AdventureRide</span>
            </div>
            <CardTitle className="text-2xl">
              {step === 1 ? "Join the Adventure" : "Tell Us About Your Ride"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Create your account to start exploring" 
                : "Help us personalize your experience"
              }
            </CardDescription>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your adventure name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="rider@adventure.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button onClick={handleNext} variant="hero" className="w-full" disabled={isLoading}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Start Adventure"}
                    <Bike className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate("/login")}
              >
                Sign in here
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;