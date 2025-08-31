import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar as CalendarIcon, MapPin, Users, Clock, DollarSign, Tent, Utensils, Fuel, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

const TripPlanningModal = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const [tripData, setTripData] = useState({
    title: "",
    description: "",
    difficulty: "",
    maxParticipants: "",
    startLocation: "",
    endLocation: "",
    estimatedDistance: "",
    estimatedCost: "",
    requirements: [] as string[],
    accommodationType: "",
    mealsIncluded: false,
    fuelStops: [] as string[],
    emergencyContact: "",
    waypoints: [] as string[],
  });

  const [newWaypoint, setNewWaypoint] = useState("");
  const [newFuelStop, setNewFuelStop] = useState("");

  const handleInputChange = (field: string, value: any) => {
    setTripData(prev => ({ ...prev, [field]: value }));
  };

  const handleRequirementChange = (requirement: string, checked: boolean) => {
    if (checked) {
      setTripData(prev => ({ 
        ...prev, 
        requirements: [...prev.requirements, requirement] 
      }));
    } else {
      setTripData(prev => ({ 
        ...prev, 
        requirements: prev.requirements.filter(req => req !== requirement) 
      }));
    }
  };

  const addWaypoint = () => {
    if (newWaypoint.trim()) {
      setTripData(prev => ({ 
        ...prev, 
        waypoints: [...prev.waypoints, newWaypoint.trim()] 
      }));
      setNewWaypoint("");
    }
  };

  const removeWaypoint = (index: number) => {
    setTripData(prev => ({ 
      ...prev, 
      waypoints: prev.waypoints.filter((_, i) => i !== index) 
    }));
  };

  const addFuelStop = () => {
    if (newFuelStop.trim()) {
      setTripData(prev => ({ 
        ...prev, 
        fuelStops: [...prev.fuelStops, newFuelStop.trim()] 
      }));
      setNewFuelStop("");
    }
  };

  const removeFuelStop = (index: number) => {
    setTripData(prev => ({ 
      ...prev, 
      fuelStops: prev.fuelStops.filter((_, i) => i !== index) 
    }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!tripData.title || !tripData.startLocation || !startDate) {
        toast({
          title: "Missing Information",
          description: "Please fill in the trip title, start location, and start date.",
          variant: "destructive"
        });
        return;
      }

      // Create trip in database
      const newTrip = await authService.createTrip({
        ...tripData,
        startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        endDate: endDate ? endDate.toISOString().split('T')[0] : null
      });

      toast({
        title: "Trip Created Successfully!",
        description: `"${tripData.title}" has been added to your adventures and is now open for riders to join.`,
      });

      setOpen(false);
      setStep(1);
      
      // Reset form data
      setTripData({
        title: "",
        description: "",
        difficulty: "",
        maxParticipants: "",
        startLocation: "",
        endLocation: "",
        estimatedDistance: "",
        estimatedCost: "",
        requirements: [],
        accommodationType: "",
        mealsIncluded: false,
        fuelStops: [],
        emergencyContact: "",
        waypoints: [],
      });
      setStartDate(undefined);
      setEndDate(undefined);

      // Optional: Redirect to trip details or refresh trip list
      console.log('Trip created:', newTrip);
      
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error Creating Trip",
        description: "Failed to create trip. Please try again.",
        variant: "destructive"
      });
    }
  };

  const requirements = [
    "Valid Motorcycle License",
    "Insurance Coverage",
    "First Aid Kit",
    "GPS Navigation",
    "Emergency Communication",
    "Protective Gear",
    "Tool Kit",
    "Spare Parts"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="h-4 w-4 mr-2" />
          Plan Adventure
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto card-bg border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Plan Your Adventure - Step {step} of 4
          </DialogTitle>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${step >= num ? 'bg-primary' : 'bg-muted'}`} />
                {num < 4 && <div className={`w-8 h-1 ${step > num ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Trip Title</Label>
                <Input
                  id="title"
                  placeholder="Epic Alpine Adventure"
                  value={tripData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your adventure route, highlights, and what makes it special..."
                  rows={4}
                  value={tripData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select onValueChange={(value) => handleInputChange("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="15"
                    value={tripData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Route & Schedule</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startLocation">Start Location</Label>
                  <Input
                    id="startLocation"
                    placeholder="Munich, Germany"
                    value={tripData.startLocation}
                    onChange={(e) => handleInputChange("startLocation", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endLocation">End Location</Label>
                  <Input
                    id="endLocation"
                    placeholder="Zurich, Switzerland"
                    value={tripData.endLocation}
                    onChange={(e) => handleInputChange("endLocation", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedDistance">Estimated Distance (km)</Label>
                <Input
                  id="estimatedDistance"
                  type="number"
                  placeholder="1250"
                  value={tripData.estimatedDistance}
                  onChange={(e) => handleInputChange("estimatedDistance", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="waypoints">Waypoints</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a waypoint..."
                    value={newWaypoint}
                    onChange={(e) => setNewWaypoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addWaypoint()}
                  />
                  <Button type="button" onClick={addWaypoint} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tripData.waypoints.map((waypoint, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {waypoint}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeWaypoint(index)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Logistics & Requirements</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Accommodation Type</Label>
                  <Select onValueChange={(value) => handleInputChange("accommodationType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select accommodation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camping">Camping</SelectItem>
                      <SelectItem value="hotel">Hotels</SelectItem>
                      <SelectItem value="hostel">Hostels</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="own">Bring Your Own</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost per Person (₹)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    placeholder="450"
                    value={tripData.estimatedCost}
                    onChange={(e) => handleInputChange("estimatedCost", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="meals"
                    checked={tripData.mealsIncluded}
                    onCheckedChange={(checked) => handleInputChange("mealsIncluded", checked)}
                  />
                  <Label htmlFor="meals">Meals included in cost</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Required Equipment & Documents</Label>
                <div className="grid grid-cols-2 gap-2">
                  {requirements.map((req) => (
                    <div key={req} className="flex items-center space-x-2">
                      <Checkbox
                        id={req}
                        checked={tripData.requirements.includes(req)}
                        onCheckedChange={(checked) => handleRequirementChange(req, checked as boolean)}
                      />
                      <Label htmlFor={req} className="text-sm">{req}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuelStops">Planned Fuel Stops</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add fuel stop location..."
                    value={newFuelStop}
                    onChange={(e) => setNewFuelStop(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFuelStop()}
                  />
                  <Button type="button" onClick={addFuelStop} variant="outline">
                    <Fuel className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tripData.fuelStops.map((stop, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      {stop}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFuelStop(index)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Final Details & Review</h3>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Information</Label>
                <Textarea
                  id="emergencyContact"
                  placeholder="Emergency contact name, phone, email, and any special medical information..."
                  rows={3}
                  value={tripData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                />
              </div>
              
              <Separator />
              
              {/* Trip Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold">Trip Summary</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><strong>Title:</strong> {tripData.title || "Not specified"}</p>
                  <p><strong>Route:</strong> {tripData.startLocation || "Start"} → {tripData.endLocation || "End"}</p>
                  <p><strong>Dates:</strong> {startDate ? format(startDate, "PPP") : "Not set"} - {endDate ? format(endDate, "PPP") : "Not set"}</p>
                  <p><strong>Difficulty:</strong> {tripData.difficulty || "Not selected"}</p>
                  <p><strong>Max Participants:</strong> {tripData.maxParticipants || "Not specified"}</p>
                  <p><strong>Distance:</strong> {tripData.estimatedDistance ? `${tripData.estimatedDistance} km` : "Not specified"}</p>
                  <p><strong>Est. Cost:</strong> {tripData.estimatedCost ? `₹${tripData.estimatedCost} per person` : "Not specified"}</p>
                  {tripData.requirements.length > 0 && (
                    <div>
                      <strong>Requirements:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tripData.requirements.map((req) => (
                          <Badge key={req} variant="outline" className="text-xs">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button variant="hero" onClick={handleNext} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} className="ml-auto">
                Create Adventure
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripPlanningModal;