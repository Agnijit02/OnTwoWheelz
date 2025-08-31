import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AddBikeDialog } from "@/components/AddBikeDialog";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { EditBikeDialog } from "@/components/EditBikeDialog";
import type { UserStats, UserBike, UserAdventure, UserPost } from "@/lib/supabase";
import { 
  MapPin, 
  Calendar, 
  Bike, 
  Trophy, 
  Route, 
  Clock, 
  Edit,
  Share,
  Medal,
  Target,
  TrendingUp,
  Mountain,
  Camera,
  Users,
  Heart,
  MessageCircle
} from "lucide-react";

const Profile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Debug: Log when component re-renders (remove this after testing)
  console.log('Profile component render - authLoading:', authLoading, 'user:', user?.id);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userBikes, setUserBikes] = useState<UserBike[]>([]);
  const [userAdventures, setUserAdventures] = useState<UserAdventure[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDataFetched, setHasDataFetched] = useState(false);
  
  // Dialog states
  const [isAddBikeDialogOpen, setIsAddBikeDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [isEditBikeDialogOpen, setIsEditBikeDialogOpen] = useState(false);
  const [selectedBikeForEdit, setSelectedBikeForEdit] = useState<UserBike | null>(null);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Stable data fetching function
  const fetchUserData = useCallback(async (userId: string) => {
    if (!userId || hasDataFetched) return;
    
    try {
      setLoading(true);
      
      // Fetch all user data in parallel
      const [stats, bikes, adventures, posts, organizedTrips, joinedTripsData] = await Promise.all([
        authService.getUserStats(userId),
        authService.getUserBikes(userId),
        authService.getUserAdventures(userId, false), // Include private adventures for own profile
        authService.getUserPosts(userId, false), // Include private posts for own profile
        authService.getUserTrips(userId),
        authService.getUserJoinedTrips(userId)
      ]);

      console.log('Profile: Data loaded - organized trips:', organizedTrips?.length || 0, 'joined trips:', joinedTripsData?.length || 0);

      setUserStats(stats);
      setUserBikes(bikes);
      setUserAdventures(adventures);
      setUserPosts(posts);
      setUserTrips(organizedTrips);
      setJoinedTrips(joinedTripsData);
      setHasDataFetched(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set empty data on error to prevent infinite loading
      setUserStats(null);
      setUserBikes([]);
      setUserAdventures([]);
      setUserPosts([]);
      setUserTrips([]);
      setJoinedTrips([]);
      setHasDataFetched(true); // Still mark as fetched to prevent retries
    } finally {
      setLoading(false);
    }
  }, [hasDataFetched]);

  // Effect to fetch data when user is available and not already fetched
  useEffect(() => {
    if (!authLoading && userId && !hasDataFetched) {
      fetchUserData(userId);
    }
  }, [authLoading, userId, hasDataFetched, fetchUserData]);

  // Effect to refresh data when component becomes visible (user might have joined/left trips)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId && hasDataFetched) {
        console.log('Profile: Visibility change - refreshing data');
        fetchUserData(userId);
      }
    };

    // Also refresh when window gains focus
    const handleFocus = () => {
      if (userId && hasDataFetched) {
        console.log('Profile: Window focus - refreshing data');
        fetchUserData(userId);
      }
    };

    // Also refresh periodically (every 30 seconds) to catch any missed updates
    const intervalId = setInterval(() => {
      if (userId && hasDataFetched) {
        console.log('Profile: Periodic refresh');
        fetchUserData(userId);
      }
    }, 30000); // 30 seconds

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [userId, hasDataFetched, fetchUserData]);

  // Reset data when user changes
  useEffect(() => {
    if (!userId) {
      setHasDataFetched(false);
      setLoading(true);
      setUserStats(null);
      setUserBikes([]);
      setUserAdventures([]);
      setUserPosts([]);
      setUserTrips([]);
      setJoinedTrips([]);
    }
  }, [userId]);

  // Dialog handlers
  const handleAddBike = async (bikeData: Partial<UserBike>) => {
    if (!user) return;
    
    try {
      const newBike = await authService.addUserBike(user.id, bikeData);
      setUserBikes(prev => [...prev, newBike]);
      toast({
        title: "Bike Added!",
        description: "Your bike has been added to your garage.",
      });
    } catch (error) {
      console.error('Error adding bike:', error);
      toast({
        title: "Error",
        description: "Failed to add bike. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditProfile = async (profileData: Partial<any>) => {
    if (!user) return;
    
    try {
      await authService.updateUserProfile(user.id, profileData);
      // Refresh profile data
      window.location.reload(); // Simple refresh for now
      toast({
        title: "Profile Updated!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditBike = async (bikeId: string, bikeData: Partial<UserBike>) => {
    if (!user) return;
    
    try {
      const updatedBike = await authService.updateUserBike(user.id, bikeId, bikeData);
      setUserBikes(prev => prev.map(bike => bike.id === bikeId ? updatedBike : bike));
      toast({
        title: "Bike Updated!",
        description: "Your bike details have been updated.",
      });
    } catch (error) {
      console.error('Error updating bike:', error);
      toast({
        title: "Error",
        description: "Failed to update bike. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    if (!user) return;
    
    try {
      await authService.deleteUserBike(user.id, bikeId);
      setUserBikes(prev => prev.filter(bike => bike.id !== bikeId));
      toast({
        title: "Bike Deleted",
        description: "Your bike has been removed from your garage.",
      });
    } catch (error) {
      console.error('Error deleting bike:', error);
      toast({
        title: "Error",
        description: "Failed to delete bike. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openEditBikeDialog = (bike: UserBike) => {
    setSelectedBikeForEdit(bike);
    setIsEditBikeDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg text-foreground">
                {authLoading ? 'Authenticating...' : 'Loading profile...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If auth is complete but no user, redirect to login
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  // Get primary bike
  const primaryBike = userBikes.find(bike => bike.is_primary) || userBikes[0];
  
  // User data from auth context and database
  const userData = {
    name: profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || "Rider",
    username: `@${profile?.username || 'rider'}`,
    location: profile?.location || "Adventure Awaits",
    joinDate: new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || "Recently",
    bio: profile?.bio || "Adventure seeker ready for the next great ride!",
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg",
    stats: {
      totalMiles: userStats?.total_miles || 0,
      adventures: userStats?.total_adventures || 0,
      followers: userStats?.followers_count || 0,
      following: userStats?.following_count || 0
    },
    bike: primaryBike ? {
      brand: primaryBike.brand,
      model: primaryBike.model,
      year: primaryBike.year?.toString() || "2024",
      color: primaryBike.color || "Adventure Ready",
      modifications: primaryBike.modifications || ["Ready for Adventure"]
    } : {
      brand: "Your Bike",
      model: "Adventure Awaits",
      year: "2024",
      color: "Adventure Ready",
      modifications: ["Ready for Adventure"]
    },
    ridingStats: {
      thisMonth: { 
        miles: userStats?.miles_this_month || 0, 
        adventures: userStats?.adventures_this_month || 0, 
        hours: userStats?.riding_hours_this_month || 0 
      },
      thisYear: { 
        miles: userStats?.miles_this_year || 0, 
        adventures: userStats?.adventures_this_year || 0, 
        hours: userStats?.riding_hours_this_year || 0 
      },
      favoriteRoutes: [profile?.favorite_type ? profile.favorite_type.charAt(0).toUpperCase() + profile.favorite_type.slice(1) : "Adventure"],
      ridingStyle: profile?.favorite_type === 'touring' ? "Adventure Touring" : 
                   profile?.favorite_type === 'offroad' ? "Off-Road Adventure" :
                   profile?.favorite_type === 'scenic' ? "Scenic Touring" :
                   profile?.favorite_type === 'track' ? "Track Riding" :
                   profile?.favorite_type === 'urban' ? "Urban Explorer" : "Adventure Riding",
      experience: profile?.experience === 'beginner' ? "Beginner (Less than 1 year)" :
                  profile?.experience === 'intermediate' ? "Intermediate (1-5 years)" :
                  profile?.experience === 'experienced' ? "Experienced (5-10 years)" :
                  profile?.experience === 'expert' ? "Expert (10+ years)" : "Ready to Ride"
    },
    achievements: [
      { id: 1, name: "Alpine Master", description: "Completed 10 alpine routes", icon: Mountain, earned: userAdventures.filter(a => a.route_type === 'alpine').length >= 10 },
      { id: 2, name: "Long Distance Rider", description: "Rode 1000+ miles in a single trip", icon: Route, earned: userAdventures.some(a => (a.distance || 0) >= 1000) },
      { id: 3, name: "Community Builder", description: "Organized 5+ group rides", icon: Users, earned: userAdventures.filter(a => (a.participants || 1) > 1).length >= 5 },
      { id: 4, name: "Adventure Photographer", description: "Shared 50+ adventure photos", icon: Camera, earned: userPosts.length >= 50 },
      { id: 5, name: "Desert Explorer", description: "Completed a desert expedition", icon: Target, earned: userAdventures.some(a => a.route_type === 'desert') },
      { id: 6, name: "Iron Rider", description: "Rode 365 days in a year", icon: Medal, earned: false } // This would need more complex logic
    ],
    recentTrips: userAdventures.slice(0, 3).map(adventure => ({
      id: adventure.id,
      title: adventure.title,
      date: new Date(adventure.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      distance: adventure.distance ? `${adventure.distance} km` : 'N/A',
      duration: adventure.duration_days ? `${adventure.duration_days} days` : 'N/A',
      difficulty: adventure.difficulty || 'Unknown',
      image: adventure.images?.[0] || '/placeholder.svg',
      participants: adventure.participants || 1
    })),
    upcomingTrips: (() => {
      console.log('Profile: Calculating upcoming trips...');
      console.log('Profile: userTrips:', userTrips?.length || 0, 'joinedTrips:', joinedTrips?.length || 0);

      // Combine and deduplicate trips
      const allTripsMap = new Map();
      [...(userTrips || []), ...(joinedTrips || [])].forEach(trip => {
        if (trip && trip.id) {
          allTripsMap.set(trip.id, trip);
        }
      });
      const allTrips = Array.from(allTripsMap.values());
      console.log('Profile: Total unique trips before filtering:', allTrips.length, 'userTrips:', userTrips?.length || 0, 'joinedTrips:', joinedTrips?.length || 0);

      const upcoming = allTrips
        .filter(trip => {
          if (!trip || !trip.start_date) {
            console.log('Profile: Skipping trip with missing data:', trip?.id);
            return false;
          }
          // Parse date consistently (avoid timezone issues)
          const tripDateStr = trip.start_date.split('T')[0]; // Get YYYY-MM-DD part
          const nowStr = new Date().toISOString().split('T')[0]; // Get current date as YYYY-MM-DD

          const isUpcoming = tripDateStr >= nowStr; // Simple string comparison
          if (isUpcoming) {
            console.log('Profile: ✅ UPCOMING -', trip.title, '- Date:', tripDateStr, '- Today:', nowStr);
          } else {
            console.log('Profile: ❌ PAST -', trip.title, '- Date:', tripDateStr, '- Today:', nowStr);
          }
          return isUpcoming;
        })
        .slice(0, 3)
        .map(trip => ({
          id: trip.id,
          title: trip.title,
          date: new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          distance: trip.distance ? `${trip.distance} km` : 'N/A',
          duration: trip.end_date
            ? `${Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
            : '1 day',
          difficulty: trip.difficulty || 'Unknown',
          image: trip.images?.[0] || '/placeholder.svg',
          participants: trip.current_participants || 1
        }));

      console.log('Profile: Final upcoming trips:', upcoming.length);
      return upcoming;
    })(),
    posts: userPosts.map(post => ({
      id: post.id,
      image: post.images[0] || '/placeholder.svg',
      caption: post.caption,
      likes: post.likes_count,
      comments: post.comments_count,
      date: new Date(post.created_at).toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'short'
      })
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Profile Header */}
          <Card className="card-bg border-border mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                <Avatar className="w-32 h-32 ring-4 ring-primary">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-2xl">{userData.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
                    <h1 className="text-3xl font-bold">{userData.name}</h1>
                    <span className="text-muted-foreground">{userData.username}</span>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {userData.location}
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-6 max-w-2xl">{userData.bio}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{userData.stats.totalMiles.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Miles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{userData.stats.adventures}</div>
                      <div className="text-sm text-muted-foreground">Adventures</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{userData.stats.followers}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{userData.stats.following}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button variant="default" onClick={() => setIsEditProfileDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const profileUrl = `${window.location.origin}/profile/${profile?.username}`;
                      navigator.clipboard.writeText(profileUrl);
                      toast({
                        title: "Profile link copied!",
                        description: "Share your adventure profile with others.",
                      });
                    }}>
                      <Share className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="upcoming_trips">Upcoming Trips</TabsTrigger>
              <TabsTrigger value="adventures">Past Adventures</TabsTrigger>
              <TabsTrigger value="bike">My Bike</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Riding Statistics */}
                <Card className="card-bg border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Riding Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">This Month</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Miles Ridden</span>
                          <span className="font-bold text-primary">{userData.ridingStats.thisMonth.miles}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Adventures</span>
                          <span className="font-bold text-accent">{userData.ridingStats.thisMonth.adventures}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Riding Hours</span>
                          <span className="font-bold">{userData.ridingStats.thisMonth.hours}h</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">This Year</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span>Annual Goal Progress</span>
                            <span className="text-sm text-muted-foreground">{userData.ridingStats.thisYear.miles}/15,000 miles</span>
                          </div>
                          <Progress value={(userData.ridingStats.thisYear.miles / 15000) * 100} className="h-2" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Adventures</span>
                          <span className="font-bold text-accent">{userData.ridingStats.thisYear.adventures}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Hours</span>
                          <span className="font-bold">{userData.ridingStats.thisYear.hours}h</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Riding Profile */}
                <Card className="card-bg border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Route className="h-5 w-5 mr-2 text-primary" />
                      Riding Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Experience Level</span>
                      <Badge variant="default">{userData.ridingStats.experience}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Riding Style</span>
                      <Badge variant="secondary">{userData.ridingStats.ridingStyle}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Member Since</span>
                      <span className="text-muted-foreground">{userData.joinDate}</span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Favorite Route Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {userData.ridingStats.favoriteRoutes.map((route) => (
                          <Badge key={route} variant="outline">{route}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upcoming_trips" className="space-y-6">
              <div className="grid gap-6">
                <h3 className="text-xl font-semibold">Your Upcoming Adventures</h3>
                {userData.upcomingTrips.length > 0 ? (
                  userData.upcomingTrips.map((trip) => (
                    <Card 
                      key={trip.id} 
                      className="card-bg border-border hover:border-primary transition-all cursor-pointer"
                      onClick={() => navigate(`/trip/${trip.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-6">
                          <img 
                            src={trip.image} 
                            alt={trip.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-lg font-semibold">{trip.title}</h4>
                              <Badge variant="default">{trip.difficulty}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                {trip.date}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Route className="h-4 w-4 mr-1" />
                                {trip.distance}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                {trip.duration}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Users className="h-4 w-4 mr-1" />
                                {trip.participants} riders
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Upcoming Adventures</h4>
                    <p className="text-muted-foreground mb-4">You don't have any upcoming trips planned.</p>
                    <p className="text-sm text-muted-foreground">Join trips from the dashboard or create your own adventure!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="adventures" className="space-y-6">
              <div className="grid gap-6">
                <h3 className="text-xl font-semibold">Past Adventures</h3>
                {userData.recentTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className="card-bg border-border hover:border-primary transition-all cursor-pointer"
                    onClick={() => navigate(`/trip/${trip.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-6">
                        <img 
                          src={trip.image} 
                          alt={trip.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-semibold">{trip.title}</h4>
                            <Badge variant="secondary">{trip.difficulty}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {trip.date}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Route className="h-4 w-4 mr-1" />
                              {trip.distance}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {trip.duration}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              {trip.participants} riders
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bike" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">My Bikes ({userBikes.length})</h3>
                <Button variant="outline" onClick={() => setIsAddBikeDialogOpen(true)}>
                  <Bike className="h-4 w-4 mr-2" />
                  Add Bike
                </Button>
              </div>
              
              {userBikes.length === 0 ? (
              <Card className="card-bg border-border">
                  <CardContent className="p-8 text-center">
                    <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No bikes added yet</h4>
                    <p className="text-muted-foreground mb-4">Add your first bike to showcase your ride!</p>
                    <Button variant="default" onClick={() => setIsAddBikeDialogOpen(true)}>
                      <Bike className="h-4 w-4 mr-2" />
                      Add Your First Bike
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {userBikes.map((bike) => (
                    <Card key={bike.id} className={`card-bg border-border ${bike.is_primary ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-semibold">{bike.name}</h4>
                            {bike.is_primary && (
                              <Badge variant="default">Primary</Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => openEditBikeDialog(bike)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <img 
                              src={bike.image_url || "/placeholder.svg"} 
                              alt={`${bike.brand} ${bike.model}`}
                              className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-semibold">Brand</span>
                                <span>{bike.brand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">Model</span>
                                <span>{bike.model}</span>
                        </div>
                              {bike.year && (
                        <div className="flex justify-between">
                          <span className="font-semibold">Year</span>
                                  <span>{bike.year}</span>
                        </div>
                              )}
                              {bike.color && (
                        <div className="flex justify-between">
                          <span className="font-semibold">Color</span>
                                  <span>{bike.color}</span>
                                </div>
                              )}
                              {bike.mileage && (
                                <div className="flex justify-between">
                                  <span className="font-semibold">Mileage</span>
                                  <span>{bike.mileage.toLocaleString()} km</span>
                        </div>
                              )}
                      </div>
                    </div>
                    
                    <div>
                            {bike.modifications && bike.modifications.length > 0 && (
                              <div className="mb-6">
                                <h5 className="font-semibold mb-3">Modifications & Upgrades</h5>
                                <div className="flex flex-wrap gap-2">
                                  {bike.modifications.map((mod, index) => (
                                    <Badge key={index} variant="outline">{mod}</Badge>
                        ))}
                      </div>
                              </div>
                            )}
                      
                            {(bike.engine_size || bike.power || bike.weight || bike.fuel_capacity) && (
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <h5 className="font-semibold mb-3">Specifications</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                                  {bike.engine_size && (
                          <div>
                            <span className="text-muted-foreground">Engine</span>
                                      <div className="font-semibold">{bike.engine_size} {bike.engine_type}</div>
                          </div>
                                  )}
                                  {bike.power && (
                          <div>
                            <span className="text-muted-foreground">Power</span>
                                      <div className="font-semibold">{bike.power}</div>
                          </div>
                                  )}
                                  {bike.weight && (
                          <div>
                            <span className="text-muted-foreground">Weight</span>
                                      <div className="font-semibold">{bike.weight}</div>
                          </div>
                                  )}
                                  {bike.fuel_capacity && (
                          <div>
                            <span className="text-muted-foreground">Fuel Tank</span>
                                      <div className="font-semibold">{bike.fuel_capacity}</div>
                          </div>
                                  )}
                        </div>
                      </div>
                            )}
                    </div>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userData.achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <Card key={achievement.id} className={`card-bg border-border ${achievement.earned ? 'ring-2 ring-primary' : 'opacity-75'}`}>
                      <CardContent className="p-6 text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-primary' : 'bg-muted'}`}>
                          <IconComponent className={`h-8 w-8 ${achievement.earned ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <h4 className="font-semibold mb-2">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                        {achievement.earned ? (
                          <Badge variant="default">Earned</Badge>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userData.posts.map((post) => (
                  <Card key={post.id} className="card-bg border-border overflow-hidden">
                    <div className="relative">
                      <img 
                        src={post.image} 
                        alt="Adventure post"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-2 right-2 flex space-x-2">
                        <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                          <Heart className="h-3 w-3 text-white" />
                          <span className="text-xs text-white">{post.likes}</span>
                        </div>
                        <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3 text-white" />
                          <span className="text-xs text-white">{post.comments}</span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm mb-2">{post.caption}</p>
                      <p className="text-xs text-muted-foreground">{post.date}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <AddBikeDialog
        isOpen={isAddBikeDialogOpen}
        onOpenChange={setIsAddBikeDialogOpen}
        onBikeAdded={handleAddBike}
      />

      <EditProfileDialog
        isOpen={isEditProfileDialogOpen}
        onOpenChange={setIsEditProfileDialogOpen}
        onProfileUpdated={handleEditProfile}
        initialData={{
          display_name: profile?.display_name,
          bio: profile?.bio,
          location: profile?.location,
          experience: profile?.experience,
          favorite_type: profile?.favorite_type,
          website_url: profile?.website_url,
          avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url
        }}
      />

      {selectedBikeForEdit && (
        <EditBikeDialog
          isOpen={isEditBikeDialogOpen}
          onOpenChange={setIsEditBikeDialogOpen}
          onBikeUpdated={handleEditBike}
          onBikeDeleted={handleDeleteBike}
          initialData={selectedBikeForEdit}
        />
      )}
    </div>
  );
};

export default Profile;