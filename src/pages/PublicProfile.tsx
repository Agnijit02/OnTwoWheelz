import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import type { UserProfile, UserStats, UserBike, UserAdventure, UserPost } from "@/lib/supabase";
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
  MessageCircle,
  UserPlus,
  UserCheck,
  Lock
} from "lucide-react";

const PublicProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userBikes, setUserBikes] = useState<UserBike[]>([]);
  const [userAdventures, setUserAdventures] = useState<UserAdventure[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        setNotFound(false);
        
        // Fetch profile by username
        const userProfile = await authService.getUserProfileByUsername(username);
        
        if (!userProfile) {
          setNotFound(true);
          return;
        }
        
        setProfile(userProfile);
        
        // Fetch all user data in parallel (public data only)
        const [stats, bikes, adventures, posts] = await Promise.all([
          authService.getUserStats(userProfile.user_id),
          authService.getUserBikes(userProfile.user_id),
          authService.getUserAdventures(userProfile.user_id, true), // Only public adventures
          authService.getUserPosts(userProfile.user_id, true) // Only public posts
        ]);
        
        setUserStats(stats);
        setUserBikes(bikes);
        setUserAdventures(adventures);
        setUserPosts(posts);
        
        // Check if current user is following this profile
        if (currentUser && currentUser.id !== userProfile.user_id) {
          try {
            const followStatus = await authService.checkFollowStatus(userProfile.user_id);
            setIsFollowing(followStatus);
          } catch (error) {
            console.error('Error checking follow status:', error);
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await authService.unfollowUser(profile.user_id);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${profile.display_name}`,
        });
      } else {
        await authService.followUser(profile.user_id);
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${profile.display_name}`,
        });
      }
      
      // Update local stats optimistically
      if (userStats) {
        setUserStats({
          ...userStats,
          followers_count: isFollowing ? userStats.followers_count - 1 : userStats.followers_count + 1
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(profileUrl);
    // TODO: Add toast notification
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg text-foreground">Loading profile...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
              <p className="text-muted-foreground mb-4">The user @{username} doesn't exist.</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get primary bike
  const primaryBike = userBikes.find(bike => bike.is_primary) || userBikes[0];
  
  // Check if this is the current user's profile
  const isOwnProfile = currentUser?.id === profile.user_id;
  
  // Component for sections that require authentication
  const ProtectedSection = ({ children, blurLevel = "blur-sm" }: { children: React.ReactNode, blurLevel?: string }) => {
    if (currentUser) {
      return <>{children}</>;
    }
    
    return (
      <div className="relative">
        <div className={`${blurLevel} pointer-events-none`}>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/20">
          <div className="text-center p-6 bg-background/90 rounded-lg border border-border">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h4 className="font-semibold mb-1">Login Required</h4>
            <p className="text-sm text-muted-foreground mb-3">Sign in to view this content</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // User data
  const userData = {
    name: profile.display_name,
    username: `@${profile.username}`,
    location: profile.location || "Adventure Awaits",
    joinDate: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    bio: profile.bio || "Adventure seeker ready for the next great ride!",
    avatar: profile.avatar_url || "/placeholder.svg",
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
    } : null,
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
      favoriteRoutes: [profile.favorite_type ? profile.favorite_type.charAt(0).toUpperCase() + profile.favorite_type.slice(1) : "Adventure"],
      ridingStyle: profile.favorite_type === 'touring' ? "Adventure Touring" : 
                   profile.favorite_type === 'offroad' ? "Off-Road Adventure" :
                   profile.favorite_type === 'scenic' ? "Scenic Touring" :
                   profile.favorite_type === 'track' ? "Track Riding" :
                   profile.favorite_type === 'urban' ? "Urban Explorer" : "Adventure Riding",
      experience: profile.experience === 'beginner' ? "Beginner (Less than 1 year)" :
                  profile.experience === 'intermediate' ? "Intermediate (1-5 years)" :
                  profile.experience === 'experienced' ? "Experienced (5-10 years)" :
                  profile.experience === 'expert' ? "Expert (10+ years)" : "Ready to Ride"
    },
    achievements: [
      { id: 1, name: "Alpine Master", description: "Completed 10 alpine routes", icon: Mountain, earned: userAdventures.filter(a => a.route_type === 'alpine').length >= 10 },
      { id: 2, name: "Long Distance Rider", description: "Rode 1000+ miles in a single trip", icon: Route, earned: userAdventures.some(a => (a.distance || 0) >= 1000) },
      { id: 3, name: "Community Builder", description: "Organized 5+ group rides", icon: Users, earned: userAdventures.filter(a => (a.participants || 1) > 1).length >= 5 },
      { id: 4, name: "Adventure Photographer", description: "Shared 50+ adventure photos", icon: Camera, earned: userPosts.length >= 50 },
      { id: 5, name: "Desert Explorer", description: "Completed a desert expedition", icon: Target, earned: userAdventures.some(a => a.route_type === 'desert') },
      { id: 6, name: "Iron Rider", description: "Rode 365 days in a year", icon: Medal, earned: false }
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
                    {isOwnProfile ? (
                      <Button variant="adventure">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : currentUser ? (
                      <Button 
                        variant={isFollowing ? "outline" : "adventure"}
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            {isFollowing ? 'Unfollowing...' : 'Following...'}
                          </>
                        ) : isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    ) : null}
                    
                    <Button variant="outline" onClick={handleShare}>
                      <Share className="h-4 w-4 mr-2" />
                      Share Profile  
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content - Same as private profile but without edit options */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="adventures">Adventures ({userAdventures.length})</TabsTrigger>
              <TabsTrigger value="bike">Bikes ({userBikes.length})</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="posts">Posts ({userPosts.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
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
                      <h4 className="font-semibold mb-3">This Year</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Miles Ridden</span>
                          <span className="font-bold text-primary">{userData.ridingStats.thisYear.miles}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Adventures</span>
                          <span className="font-bold text-accent">{userData.ridingStats.thisYear.adventures}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Riding Hours</span>
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

            {/* Adventures Tab */}
            <TabsContent value="adventures" className="space-y-6">
              <ProtectedSection>
                <div className="grid gap-6">
                  <h3 className="text-xl font-semibold">Recent Adventures</h3>
                  {userData.recentTrips.length === 0 ? (
                    <Card className="card-bg border-border">
                      <CardContent className="p-8 text-center">
                        <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-semibold mb-2">No adventures shared yet</h4>
                        <p className="text-muted-foreground">Check back later for amazing adventures!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    userData.recentTrips.map((trip) => (
                      <Card key={trip.id} className="card-bg border-border">
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
                    ))
                  )}
                </div>
              </ProtectedSection>
            </TabsContent>

            {/* Bikes Tab */}
            <TabsContent value="bike" className="space-y-6">
              <ProtectedSection>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Bikes ({userBikes.length})</h3>
                </div>
                
                {userBikes.length === 0 ? (
                  <Card className="card-bg border-border">
                    <CardContent className="p-8 text-center">
                      <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No bikes shared yet</h4>
                      <p className="text-muted-foreground">This rider hasn't added their bikes yet!</p>
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
              </ProtectedSection>
            </TabsContent>

            {/* Achievements Tab */}
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

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-6">
              {userData.posts.length === 0 ? (
                <Card className="card-bg border-border">
                  <CardContent className="p-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No posts yet</h4>
                    <p className="text-muted-foreground">This rider hasn't shared any adventures yet!</p>
                  </CardContent>
                </Card>
              ) : (
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
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

