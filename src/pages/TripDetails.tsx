import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Clock,
  Route,
  Users,
  Share,
  Heart,
  MessageCircle,
  Navigation as NavigationIcon,
  Camera,
  AlertTriangle,
  ThermometerSun,
  Wind,
  Fuel,
  ArrowLeft,
  Star
} from "lucide-react";

const TripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Create a formatted version of trip data for display
  const formattedTripData = tripData ? {
    ...tripData,
    gallery: tripData.images || ["https://imgcld.yatra.com/ytimages/image/upload/v1554203593/AdvNation/ANN_TRP772/uttarakhand_motorcycle_tour_2zdPJv.jpg"],
    location: {
      start: tripData.start_location,
      end: tripData.end_location
    },
    date: {
      start: new Date(tripData.start_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      end: tripData.end_date ? new Date(tripData.end_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : null
    },
    price: tripData.estimated_cost || 'Contact Organizer',
    participants: tripData.participants?.map((p: any) => ({
      name: p.user_profiles?.display_name || "Anonymous Rider",
      avatar: p.user_profiles?.avatar_url || "/placeholder.svg",
      location: "Adventure Seeker"
    })) || []
  } : null;

  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) return;
      
      try {
        setLoading(true);
        const trip = await authService.getTripById(tripId);
        setTripData(trip);
        
        // Check if user is the organizer
        if (user && trip.organizer_id === user.id) {
          setIsOrganizer(true);
          setIsJoined(true); // Organizer is automatically "joined"
        } else if (user) {
        // Check if user is already joined
          const joined = await authService.checkTripParticipation(tripId);
          setIsJoined(joined);
        }

        // Load chat messages
        if (tripId) {
          try {
            const messages = await authService.getTripChatMessages(tripId);
            setChatMessages(messages);
            console.log('Chat messages loaded:', messages.length);
          } catch (error) {
            console.error('Error loading chat messages:', error);
            setChatMessages([]); // Set empty array on error
            toast({
              title: "Chat Unavailable",
              description: "Unable to load chat messages at this time.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error fetching trip:', error);
        toast({
          title: "Error",
          description: "Failed to load trip details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, user]);

  const handleJoinLeave = async () => {
    if (!user || !tripData) {
      toast({
        title: "Login Required",
        description: "Please log in to join this trip.",
        variant: "destructive"
      });
      return;
    }

    // Prevent organizer from leaving their own trip
    if (isOrganizer) {
      toast({
        title: "Cannot Leave Trip",
        description: "As the trip organizer, you cannot leave your own trip.",
        variant: "destructive"
      });
      return;
    }

    setJoinLoading(true);
    try {
      if (isJoined) {
        await authService.leaveTrip(tripId!);
        setIsJoined(false);
        setTripData((prev: any) => ({
          ...prev,
          current_participants: prev.current_participants - 1
        }));
        toast({
          title: "Left Trip",
          description: "You have left the trip.",
        });
      } else {
        await authService.joinTrip(tripId!);
        setIsJoined(true);
        setTripData((prev: any) => ({
          ...prev,
          current_participants: prev.current_participants + 1
        }));
        toast({
          title: "Joined Trip!",
          description: "You have successfully joined the trip.",
        });
      }
    } catch (error: any) {
      console.error('Error joining/leaving trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update trip participation.",
        variant: "destructive"
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !tripId) return;

    try {
      await authService.sendTripMessage(tripId, newMessage.trim());
      setNewMessage("");

      // Refresh chat messages
      const messages = await authService.getTripChatMessages(tripId);
      setChatMessages(messages);

      // Auto-scroll to bottom of chat
      setTimeout(() => {
        const chatContainer = document.querySelector('.h-64.overflow-y-auto');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message. You may not have permission.",
        variant: "destructive"
      });
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim() || !isOrganizer || !tripId) return;

    try {
      const currentImages = tripData?.images || [];
      const updatedImages = [...currentImages, newImageUrl.trim()];

      await authService.updateTripImages(tripId, updatedImages);
      setTripData((prev: any) => ({
        ...prev,
        images: updatedImages
      }));
      setNewImageUrl("");
      toast({
        title: "Image Added",
        description: "Image has been added to the trip gallery.",
      });
    } catch (error: any) {
      console.error('Error adding image:', error);
      toast({
        title: "Error",
        description: "Failed to add image.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!isOrganizer || !tripId) return;

    const currentImages = tripData?.images || [];
    if (currentImages.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one image is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl);
      await authService.updateTripImages(tripId, updatedImages);
      setTripData((prev: any) => ({
        ...prev,
        images: updatedImages
      }));
      toast({
        title: "Image Removed",
        description: "Image has been removed from the trip gallery.",
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg text-foreground">Loading trip details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Trip Not Found</h1>
              <p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format trip data for display
  const displayData = {
    id: tripData.id,
    title: tripData.title,
    description: tripData.description || "Join this amazing motorcycle adventure!",
    organizer: {
      name: tripData.organizer?.display_name || "Trip Organizer",
      username: `@${tripData.organizer?.username || 'organizer'}`,
      avatar: tripData.organizer?.avatar_url || "/placeholder.svg",
      rating: 4.8, // Default rating
      trips: 15 // Default trip count
    },
    date: {
      start: new Date(tripData.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      end: tripData.end_date ? new Date(tripData.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null
    },
    duration: tripData.end_date 
      ? `${Math.ceil((new Date(tripData.end_date).getTime() - new Date(tripData.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
      : "1 day",
    distance: tripData.distance ? `${tripData.distance} km` : "Distance TBD",
    difficulty: tripData.difficulty || "Intermediate",
    maxParticipants: tripData.max_participants,
    currentParticipants: tripData.current_participants,
    price: tripData.estimated_cost || "Contact organizer",
    status: tripData.status || "Open",
    location: {
      start: tripData.start_location,
      end: tripData.end_location || tripData.start_location
    },
    highlights: tripData.waypoints || [
      "Amazing scenic routes",
      "Great company",
      "Memorable adventure"
    ],
    route: tripData.waypoints?.map((waypoint: string, index: number) => ({
      day: index + 1,
      location: waypoint,
      distance: "TBD",
      description: `Stop ${index + 1}: ${waypoint}`
    })) || [
      { day: 1, location: tripData.start_location, distance: "Start", description: "Trip begins" }
    ],
    requirements: tripData.requirements || [
      "Valid motorcycle license",
      "Proper riding gear",
      "Basic riding experience"
    ],
    included: [
      "Roadside Assistance – mechanics, towing, SOS support",
      "Bike & Personal Insurance – trip-based coverage",
      "Verified Food Partners – clean, biker-friendly stops",
      "Verified Lodging Partners – safe stays with bike parking"
    ],
    notIncluded: [
      "Motorcycle rental",
      "Fuel costs",
      "Meals",
      "Personal expenses"
    ],
    weather: {
      temperature: "15-22°C",
      conditions: "Partly cloudy",
      wind: "10-15 km/h"
    },
    gallery: tripData.images || ["https://imgcld.yatra.com/ytimages/image/upload/v1554203593/AdvNation/ANN_TRP772/uttarakhand_motorcycle_tour_2zdPJv.jpg"],
    participants: [
      // Include organizer as first participant
      {
        id: 'organizer',
        name: tripData.organizer?.display_name || "Trip Organizer",
        avatar: tripData.organizer?.avatar_url || "/placeholder.svg",
        location: "Trip Organizer",
        isOrganizer: true
      },
      // Include other participants (excluding organizer if they're also a participant)
      ...(tripData.participants?.filter((p: any) => p.user_id !== tripData.organizer_id).map((p: any) => ({
        id: p.id,
        name: p.user_profiles?.display_name || "Anonymous Rider",
        avatar: p.user_profiles?.avatar_url || "/placeholder.svg",
        location: "Adventure Seeker",
        isOrganizer: false
      })) || [])
    ],
    // Calculate actual participant count (exclude organizer from current_participants if they're counted there)
    actualParticipantCount: (() => {
      const otherParticipants = tripData.participants?.filter((p: any) => p.user_id !== tripData.organizer_id) || [];
      return otherParticipants.length + 1; // +1 for organizer
    })(),
    comments: [
      {
        id: 1,
        user: "Maria Schmidt",
        avatar: "/placeholder.svg",
        comment: "Can't wait for this adventure! My first time doing the Stelvio Pass 🏍️",
        time: "2 hours ago",
        likes: 5
      },
      {
        id: 2,
        user: "Johannes Berg",
        avatar: "/placeholder.svg",
        comment: "Alex organizes the best tours! His alpine routes are legendary.",
        time: "5 hours ago",
        likes: 8
      },
      {
        id: 3,
        user: "Sophie Laurent",
        avatar: "/placeholder.svg",
        comment: "Question about the weather - should we bring rain gear?",
        time: "1 day ago",
        likes: 3
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          {/* Hero Section */}
          <Card className="card-bg border-border mb-8 overflow-hidden">
            <div className="relative h-64 bg-gradient-to-r from-primary/20 to-accent/20">
              <img 
                src={displayData.gallery[0]}
                alt={displayData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{displayData.title}</h1>
                    <div className="flex items-center space-x-4 text-white/90">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {displayData.location.start}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {displayData.date.start}
                      </div>
                      <Badge variant="secondary">{displayData.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">₹{displayData.price}</div>
                    <div className="text-white/75">per person</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Trip Overview */}
              <Card className="card-bg border-border shadow-lg rounded-xl">
                <CardHeader className="bg-muted/30 rounded-t-xl p-5">
                  <CardTitle className="text-lg font-semibold text-center">
                    Trip Overview
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8 p-6">
                  {/* Description */}
                  <div>
                    <p className="text-foreground leading-relaxed">
                      {displayData.description}
                    </p>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Trip Details</h4>

                    <div className="space-y-3">
                      <div className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{displayData.duration}</span>
                      </div>

                      <div className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-medium">{displayData.distance}</span>
                      </div>

                      <div className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <span className="text-muted-foreground">Difficulty</span>
                        <Badge
                          variant="outline"
                          className={
                            displayData.difficulty === "Beginner"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : displayData.difficulty === "Intermediate"
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : displayData.difficulty === "Advanced"
                              ? "bg-orange-100 text-orange-700 border-orange-300"
                              : "bg-red-100 text-red-700 border-red-300" // Expert
                          }
                        >
                          {displayData.difficulty}
                        </Badge>
                      </div>

                      <div className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <span className="text-muted-foreground">Participants</span>
                        <span className="font-medium">
                          {displayData.actualParticipantCount}/{displayData.maxParticipants}
                        </span>
                      </div>

                      <div className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <span className="text-muted-foreground">Start Location</span>
                        <span className="font-medium">{displayData.location.start}</span>
                      </div>

                      <div className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <span className="text-muted-foreground">End Location</span>
                        <span className="font-medium">{displayData.location.end || displayData.location.start}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Route Details */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Route className="h-5 w-5 mr-2" />
                    Daily Route
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayData.route.map((day) => (
                      <div key={day.day} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                          {day.day}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{day.location}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{day.description}</p>
                          <div className="flex items-center text-sm">
                            <Route className="h-3 w-3 mr-1" />
                            {day.distance}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Highlights */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle>Trip Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {displayData.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements & Included */}
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="card-bg border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {displayData.requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                          <span className="text-sm">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="card-bg border-border">
                  <CardHeader>
                    <CardTitle className="text-green-600">What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {displayData.included.map((item, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Gallery */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                      Photo Gallery ({displayData.gallery.length})
                    </div>
                    {isOrganizer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('add-image-input')?.focus()}
                      >
                        Add Image
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add Image Input (for organizers) */}
                    {isOrganizer && (
                      <div className="flex space-x-2">
                        <input
                          id="add-image-input"
                          type="url"
                          placeholder="Enter image URL..."
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddImage()}
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddImage}
                          disabled={!newImageUrl.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    )}

                    {/* Image Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {displayData.gallery.map((image, index) => (
                        <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Trip photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                          {isOrganizer && displayData.gallery.length > 1 && (
                            <button
                              onClick={() => handleRemoveImage(image)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="Remove image"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trip Chat */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Trip Chat ({chatMessages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chat Messages */}
                    <div className="h-64 overflow-y-auto space-y-3 p-2 border rounded-md bg-muted/30">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div key={message.id} className={`flex items-start space-x-3 ${message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={message.sender_profile?.avatar_url} />
                              <AvatarFallback>
                                {message.sender_profile?.display_name?.[0] || message.sender_profile?.username?.[0] || 'U'}
                              </AvatarFallback>
                        </Avatar>
                            <div className={`flex-1 max-w-[70%] ${message.sender_id === user?.id ? 'text-right' : ''}`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium">
                                  {message.sender_id === user?.id ? 'You' :
                                   message.sender_profile?.display_name || message.sender_profile?.username || 'Anonymous'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className={`p-3 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground ml-auto'
                                  : 'bg-background border'
                              }`}>
                                <p className="text-sm">{message.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Send Message */}
                    {(isJoined || isOrganizer) && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          Send
                          </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Join Trip Card */}
              <Card className="card-bg border-border">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2">₹{displayData.price}</div>
                    <div className="text-muted-foreground">per person</div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span>Available spots</span>
                      <span className="font-semibold">{displayData.maxParticipants - displayData.actualParticipantCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge variant="default">{displayData.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isOrganizer ? (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="w-full justify-center py-2">
                          Trip Organizer
                        </Badge>
                      </div>
                    ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleJoinLeave}
                      variant={isJoined ? "outline" : "default"}
                        disabled={joinLoading || (!isJoined && displayData.currentParticipants >= displayData.maxParticipants)}
                    >
                      {joinLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          {isJoined ? 'Leaving...' : 'Joining...'}
                        </div>
                        ) : isJoined ? "Leave Trip" : displayData.currentParticipants >= displayData.maxParticipants ? "Trip Full" : "Join Adventure"}
                    </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle>Trip Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={displayData.organizer.avatar} />
                      <AvatarFallback>{displayData.organizer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{displayData.organizer.name}</h4>
                      <p className="text-sm text-muted-foreground">{displayData.organizer.username}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs">{displayData.organizer.rating}</span>
                        <span className="text-xs text-muted-foreground">• {displayData.organizer.trips} trips</span>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Participants */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Participants ({displayData.actualParticipantCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayData.participants.map((participant, index) => (
                      <div key={participant.id || index} className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{participant.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="font-semibold text-sm">{participant.name}</div>
                            {participant.isOrganizer && (
                              <Badge variant="secondary" className="text-xs">Organizer</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{participant.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
