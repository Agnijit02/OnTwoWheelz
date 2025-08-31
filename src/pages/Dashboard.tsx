import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navigation from "@/components/Navigation";
import TripPlanningModal from "@/components/TripPlanningModal";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  Heart,
  Calendar,
  Users,
  Bell,
  Search,
  MoreHorizontal,
  Bike,
  Route,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreatePostModal from "@/components/CreatePostModal";
import PostImageCarousel from "@/components/PostImageCarousel";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // State management
  const [posts, setPosts] = useState<any[]>([]);

  const [activities, setActivities] = useState<any[]>([]);

  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [postOffset, setPostOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>({});
  const [discoverTrips, setDiscoverTrips] = useState<any[]>([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  
  const userDisplayName = profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || "Rider";

  // Load initial data
  useEffect(() => {
    if (user) {
      console.log('🔄 [DEBUG] Dashboard: Starting data load for user:', user.id);
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔄 [DEBUG] Dashboard: Loading all data...');
      
      // Load data one by one to isolate issues
      console.log('🔄 [DEBUG] Dashboard: Loading posts...');
      const postsData = await authService.getGlobalFeed(10, 0);
      console.log('✅ [DEBUG] Dashboard: Posts loaded:', postsData.length);
      setPosts(postsData);



      console.log('🔄 [DEBUG] Dashboard: Loading activities...');
      const activitiesData = await authService.getUserActivity(user.id, 5);
      console.log('✅ [DEBUG] Dashboard: Activities loaded:', activitiesData.length);
      setActivities(activitiesData);



      console.log('🔄 [DEBUG] Dashboard: Loading user stats...');
      const statsData = await authService.getUserStats(user.id);
      console.log('✅ [DEBUG] Dashboard: Stats loaded:', statsData);
      setUserStats(statsData);

      console.log('🔄 [DEBUG] Dashboard: Loading discover trips...');
      const tripsData = await authService.getPublicTrips(5, 0);
      console.log('✅ [DEBUG] Dashboard: Trips loaded:', tripsData.length);
      if (tripsData.length === 0) {
        console.log('⚠️ [DEBUG] Dashboard: No trips loaded for discover section');
      } else {
        console.log('📋 [DEBUG] Dashboard: First discover trip:', tripsData[0]);
      }
      setDiscoverTrips(tripsData);

      setPostOffset(10);

      // Get like status and counts for posts
      if (postsData.length > 0) {
        console.log('🔄 [DEBUG] Dashboard: Loading like statuses and counts...');
        const postIds = postsData.map((post: any) => post.id);

        // Get like statuses for current user
        const likesStatus = await authService.getPostLikeStatus(user.id, postIds);
        setLikedPosts(likesStatus);

        // Get actual like counts from database
        const likeCountPromises = postIds.map(id => fetchLikeCount(id));
        const likeCounts = await Promise.all(likeCountPromises);
        const likeCountMap: Record<string, number> = {};
        postIds.forEach((id, index) => {
          likeCountMap[id] = likeCounts[index];
        });
        setPostLikeCounts(likeCountMap);

        console.log('✅ [DEBUG] Dashboard: Like statuses and counts loaded');
      }

      console.log('🎉 [DEBUG] Dashboard: All data loaded successfully!');

    } catch (error) {
      console.error('💥 [DEBUG] Dashboard: Error loading data:', error);
      toast({
        title: "Database Connection Issue",
        description: "Some features may not work properly. Please check the console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load more posts for infinite scroll
  const loadMorePosts = async () => {
    if (!user || postsLoading || !hasMorePosts) return;

    try {
      setPostsLoading(true);
      const newPosts = await authService.getGlobalFeed(10, postOffset);

      if (newPosts.length === 0) {
        setHasMorePosts(false);
        return;
      }

      // Deduplicate posts based on ID to prevent duplicates
      setPosts(prev => {
        const existingPostIds = new Set(prev.map(post => post.id));
        const uniqueNewPosts = newPosts.filter(post => !existingPostIds.has(post.id));
        return [...prev, ...uniqueNewPosts];
      });

      setPostOffset(prev => prev + 10);

      // Get like status and counts for new posts (only unique ones)
      const existingPostIds = new Set(posts.map(post => post.id));
      const uniqueNewPosts = newPosts.filter(post => !existingPostIds.has(post.id));
      const postIds = uniqueNewPosts.map((post: any) => post.id);

      if (postIds.length > 0) {
        const likesStatus = await authService.getPostLikeStatus(user.id, postIds);
        setLikedPosts(prev => ({ ...prev, ...likesStatus }));

        // Get actual like counts for new posts
        const newLikeCountPromises = postIds.map(id => fetchLikeCount(id));
        const newLikeCounts = await Promise.all(newLikeCountPromises);
        const newLikeCountMap: Record<string, number> = {};
        postIds.forEach((id, index) => {
          newLikeCountMap[id] = newLikeCounts[index];
        });
        setPostLikeCounts(prev => ({ ...prev, ...newLikeCountMap }));
      }

    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch like count directly from database
  const fetchLikeCount = async (postId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error fetching like count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in fetchLikeCount:', error);
      return 0;
    }
  };

  // Handle post like
  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const isLiked = await authService.togglePostLike(user.id, postId);
      setLikedPosts(prev => ({ ...prev, [postId]: isLiked }));

      // Fetch updated like count directly from database
      const updatedCount = await fetchLikeCount(postId);
      setPostLikeCounts(prev => ({ ...prev, [postId]: updatedCount }));

      toast({
        title: isLiked ? "Liked!" : "Unliked",
        description: isLiked ? "Added to your favorite adventures." : "Removed from favorites.",
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    try {
      const results = await authService.searchUsers(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Navigate to user profile
  const goToProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };



  // Handle post creation
  const handlePostCreated = async () => {
    setShowCreatePostModal(false);
    // Refresh posts to show the new post
    try {
      const newPosts = await authService.getGlobalFeed(10, 0);
      setPosts(newPosts);
      setPostOffset(10);

      // Get like status and counts for new posts
      if (newPosts.length > 0 && user) {
        const postIds = newPosts.map((post: any) => post.id);

        // Get like statuses
        const likesStatus = await authService.getPostLikeStatus(user.id, postIds);
        setLikedPosts(likesStatus);

        // Get actual like counts
        const likeCountPromises = postIds.map(id => fetchLikeCount(id));
        const likeCounts = await Promise.all(likeCountPromises);
        const likeCountMap: Record<string, number> = {};
        postIds.forEach((id, index) => {
          likeCountMap[id] = likeCounts[index];
        });
        setPostLikeCounts(likeCountMap);
      }

      toast({
        title: "Post Created!",
        description: "Your adventure has been shared successfully.",
      });
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  };

  const handleJoinTrip = async (tripId: string) => {
    try {
      await authService.joinTrip(tripId);

      toast({
        title: "Trip Joined!",
        description: "You have successfully joined the trip.",
      });

      // Update the trip in the local state
      setDiscoverTrips(trips =>
        trips.map(trip =>
          trip.id === tripId
            ? { ...trip, current_participants: trip.current_participants + 1 }
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

  // Scroll handler for infinite loading
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || postsLoading) return;
    loadMorePosts();
  }, [postsLoading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg text-foreground">Loading your dashboard...</div>
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
            <h1 className="text-3xl font-bold">Welcome back, {userDisplayName}!</h1>
                          <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <Card className="absolute top-full mt-2 w-full z-50 card-bg border-border max-h-64 overflow-y-auto">
                      <CardContent className="p-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              goToProfile(user.username);
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{user.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCreatePostModal(true)}
                  className="flex items-center"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Share Adventure
                </Button>
                <TripPlanningModal />
              </div>
          </div>



          {/* 3-Column Instagram-style Layout */}
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar - Trip Discovery & Stats */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Discover Trips */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Discover Trips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {discoverTrips.length === 0 ? (
                    <div className="text-center py-8">
                      <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No trips available yet!</p>
                      <p className="text-xs text-muted-foreground mt-2">Be the first to plan an adventure.</p>
                    </div>
                  ) : (
                    discoverTrips.map((trip) => (
                        <Card key={trip.id} className="p-4 hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/trip/${trip.id}`)}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">{trip.title}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              trip.difficulty?.toLowerCase() === "beginner"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : trip.difficulty?.toLowerCase() === "intermediate"
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : trip.difficulty?.toLowerCase() === "advanced"
                                ? "bg-orange-100 text-orange-700 border-orange-300"
                                : trip.difficulty?.toLowerCase() === "expert"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {trip.difficulty}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{trip.start_location}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{trip.current_participants}/{trip.max_participants}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinTrip(trip.id);
                              }}
                              disabled={trip.current_participants >= trip.max_participants}
                            >
                              {trip.current_participants >= trip.max_participants ? 'Full' : 'Join'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}

                  {/* View All Button */}
                  {discoverTrips.length > 0 && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/alltrips')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        View All Trips
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>

            {/* Center Feed - Main Content */}
            <div className="lg:col-span-6 space-y-6">
              


              {/* Posts Feed */}
              {posts.length === 0 ? (
                <Card className="card-bg border-border">
                  <CardContent className="text-center py-12">
                    <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">Start sharing your adventures to see them here!</p>
                    <Button onClick={() => setShowCreatePostModal(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Share Adventure
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="card-bg border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.user_profiles?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{post.user_profiles?.display_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{post.user_profiles?.display_name || "Anonymous"}</p>
                            {post.location && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {post.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => goToProfile(post.user_profiles?.username)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <div className="px-6 pb-3">
                      {post.images && post.images.length > 0 && (
                        <PostImageCarousel
                          images={post.images}
                          className="w-full"
                        />
                      )}
                    </div>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id)}
                            className="p-0 hover:bg-transparent"
                          >
                            <Heart className={`h-5 w-5 ${likedPosts[post.id] ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {authService.formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold mb-1">
                        {postLikeCounts[post.id] ?? post.likes_count ?? 0} likes
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold mr-2">{post.user_profiles?.display_name}</span>
                        {post.caption}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Load More Posts */}
              {postsLoading && (
                <Card className="card-bg border-border">
                  <CardContent className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading more adventures...</p>
                  </CardContent>
                </Card>
              )}

              {!hasMorePosts && posts.length > 0 && (
                <Card className="card-bg border-border">
                  <CardContent className="text-center py-8">
                    <p className="text-sm text-muted-foreground">You've seen all the latest adventures!</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar - Chat & Activity */}
            <div className="lg:col-span-3 space-y-6">
              


              {/* Recent Activity */}
              <Card className="card-bg border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-primary" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-6">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  ) : (
                    activities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={activity.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{activity.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{activity.user}</span>
                            <span className="text-muted-foreground ml-1">{activity.action}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="card-bg border-border">
                <CardContent className="p-4 space-y-3">
                  <TripPlanningModal />
                  <Button variant="outline" className="w-full" onClick={() => setShowCreatePostModal(true)}>
                    <Camera className="h-4 w-4 mr-2" />
                    Share Adventure
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/alltrips')}>
                    <Route className="h-4 w-4 mr-2" />
                    Find Trips
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Dashboard;
