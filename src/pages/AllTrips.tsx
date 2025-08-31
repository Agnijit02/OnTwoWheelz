import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Filter,
  Bike,
  Clock,
  ArrowLeft
} from "lucide-react";



const AllTrips = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [trips, setTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Load trips
  useEffect(() => {
    loadAllTrips();
  }, []);

  // Filter and sort trips
  useEffect(() => {
    let filtered = [...trips];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.start_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.end_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(trip => trip.difficulty === difficultyFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "start_date":
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case "participants":
          return (b.current_participants || 0) - (a.current_participants || 0);
        default:
          return 0;
      }
    });

    setFilteredTrips(filtered);
  }, [trips, searchQuery, difficultyFilter, sortBy]);

  const loadAllTrips = async () => {
    try {
      setLoading(true);
      // Get all public trips (set a high limit)
      const allTrips = await authService.getPublicTrips(100, 0);
      setTrips(allTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast({
        title: "Error",
        description: "Failed to load trips. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async (tripId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join trips.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      await authService.joinTrip(tripId);

      toast({
        title: "Trip Joined!",
        description: "You have successfully joined the trip.",
      });

      // Update the trip in local state
      setTrips(trips =>
        trips.map(trip =>
          trip.id === tripId
            ? { ...trip, current_participants: (trip.current_participants || 0) + 1 }
            : trip
        )
      );
    } catch (error: any) {

      // Provide more specific error messages
      let errorMessage = "Failed to join trip. Please try again.";
      if (error.message) {
        if (error.message.includes('Trip not found')) {
          errorMessage = "Trip not found. It may have been removed.";
        } else if (error.message.includes('Trip is not open')) {
          errorMessage = "This trip is no longer accepting new participants.";
        } else if (error.message.includes('Trip is full')) {
          errorMessage = "This trip is already full.";
        } else if (error.message.includes('already a participant')) {
          errorMessage = "You are already a participant in this trip.";
        } else if (error.message.includes('does not exist in the database')) {
          errorMessage = "Trip data is outdated. Please refresh the page and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg text-foreground">Loading all trips...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">All Trips</h1>
                <p className="text-muted-foreground mt-1">
                  Discover and join upcoming motorcycle adventures
                </p>
              </div>
            </div>


          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trips..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Difficulty Filter */}
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="start_date">Start Date</SelectItem>
                    <SelectItem value="participants">Most Popular</SelectItem>
                  </SelectContent>
                </Select>

                {/* Results Count */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Filter className="h-4 w-4 mr-2" />
                  {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trips Grid */}
          {filteredTrips.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bike className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trips found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || difficultyFilter !== "all"
                    ? "Try adjusting your filters to find more trips."
                    : "No trips are currently available."
                  }
                </p>
                {(searchQuery || difficultyFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setDifficultyFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => navigate(`/trip/${trip.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{trip.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{trip.start_location}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getDifficultyColor(trip.difficulty)}`}>
                        {trip.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col space-y-4">
                    {/* Trip Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(trip.start_date)}</span>
                        {trip.end_date && trip.end_date !== trip.start_date && (
                          <span className="ml-1">- {formatDate(trip.end_date)}</span>
                        )}
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{trip.current_participants || 0}/{trip.max_participants} participants</span>
                      </div>

                      {trip.distance && (
                        <div className="flex items-center text-muted-foreground">
                          <Bike className="h-4 w-4 mr-2" />
                          <span>{trip.distance} km</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {trip.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {trip.description}
                      </p>
                    )}

                    {/* Organizer */}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>Organized by</span>
                      <span className="font-medium text-foreground">
                        {trip.organizer?.display_name || 'Anonymous'}
                      </span>
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1"></div>

                    {/* Join Button - Fixed to bottom */}
                    <div className="mt-auto pt-4">
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinTrip(trip.id);
                        }}
                        disabled={(trip.current_participants || 0) >= trip.max_participants}
                      >
                        {(trip.current_participants || 0) >= trip.max_participants ? 'Trip Full' : 'Join Trip'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllTrips;
