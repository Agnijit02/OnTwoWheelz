import { supabase } from './supabase'
import type { UserProfile, UserStats, UserBike, UserAdventure, UserPost } from './supabase'

export interface RegisterData {
  name: string
  email: string
  password: string
  bikeBrand?: string
  bikeModel?: string
  bikeYear?: string
  experience?: string
  favoriteType?: string
  bio?: string
}

export interface UserProfileData {
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  location?: string
  experience?: string
  favorite_type?: string
  website_url?: string
}

export interface LoginData {
  email: string
  password: string
}

// Authentication functions
// Debug functions (available in development)
if (process.env.NODE_ENV === 'development') {
  (window as any).debugTripChat = async (tripId: string) => {
    console.log('🧪 [DEBUG] Testing trip chat for trip:', tripId);

    try {
      // Test getting messages
      const messages = await authService.getTripChatMessages(tripId);
      console.log('✅ [DEBUG] Chat messages fetched:', messages.length, 'messages');

      // Test sending message
      const testMessage = await authService.sendTripMessage(tripId, 'Test message from debug function');
      console.log('✅ [DEBUG] Test message sent:', testMessage);

      // Refresh messages
      const updatedMessages = await authService.getTripChatMessages(tripId);
      console.log('✅ [DEBUG] Messages after send:', updatedMessages.length, 'messages');

    } catch (error) {
      console.error('❌ [DEBUG] Chat test failed:', error);
    }
  };

  (window as any).debugTripJoin = async (tripId: string) => {
    console.log('🧪 [DEBUG] Testing trip join for trip:', tripId);

    try {
      const result = await authService.joinTrip(tripId);
      console.log('✅ [DEBUG] Successfully joined trip:', result);
    } catch (error) {
      console.error('❌ [DEBUG] Join trip failed:', error);
    }
  };

  (window as any).debugChatPermission = async (tripId: string) => {
    console.log('🧪 [DEBUG] Testing chat permissions for trip:', tripId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [DEBUG] No authenticated user');
      return;
    }

    // Check participation
    const { data: participation, error: partError } = await supabase
      .from('trip_participants')
      .select('id, status')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .in('status', ['joined', 'confirmed', 'accepted', 'active', 'pending'])
      .single();

    // Check if organizer
    const { data: trip, error: tripError } = await supabase
      .from('group_trips')
      .select('organizer_id')
      .eq('id', tripId)
      .single();

    console.log('🔍 [DEBUG] Chat permission details:', {
      tripId,
      userId: user.id,
      participation: participation ? { id: participation.id, status: participation.status } : null,
      partError: partError?.message,
      tripOrganizer: trip?.organizer_id,
      isOrganizer: trip?.organizer_id === user.id,
      canChat: (!partError && participation) || (trip && trip.organizer_id === user.id)
    });
  };

  (window as any).debugFollowerCounts = async () => {
    console.log('🧪 [DEBUG] Testing follower count updates');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [DEBUG] No authenticated user');
      return;
    }

    // Get current stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('followers_count, following_count')
      .eq('user_id', user.id)
      .single();

    // Get actual follower relationships
    const { data: followers } = await supabase
      .from('user_followers')
      .select('follower_id')
      .eq('following_id', user.id);

    const { data: following } = await supabase
      .from('user_followers')
      .select('following_id')
      .eq('follower_id', user.id);

    console.log('🔍 [DEBUG] Follower count analysis:', {
      userId: user.id,
      storedFollowers: stats?.followers_count || 0,
      actualFollowers: followers?.length || 0,
      storedFollowing: stats?.following_count || 0,
      actualFollowing: following?.length || 0,
      matches: {
        followers: (stats?.followers_count || 0) === (followers?.length || 0),
        following: (stats?.following_count || 0) === (following?.length || 0)
      }
    });
  };

  console.log('🔧 [DEBUG] Debug functions available:');
  console.log('  - window.debugTripChat(tripId) - Test trip chat functionality');
  console.log('  - window.debugTripJoin(tripId) - Test trip joining with status fallback');
  console.log('  - window.debugChatPermission(tripId) - Check chat permissions for current user');
  console.log('  - window.debugFollowerCounts() - Check if follower counts match reality');
}

export const authService = {
  // Trip Chat Functions
  getTripChatMessages: async (tripId: string) => {
    // First get chat messages
    const { data: messages, error: messagesError } = await supabase
      .from('trip_chat_messages')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;
    if (!messages || messages.length === 0) return [];

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];

    // Get user profiles for these senders
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', senderIds);

    if (profilesError) {
      console.warn('Error fetching user profiles for chat:', profilesError);
      // Continue without profiles if there's an error
    }

    // Merge messages with profiles
    const messagesWithProfiles = messages.map(message => ({
      ...message,
      sender_profile: profiles?.find(profile => profile.id === message.sender_id) || null
    }));

    return messagesWithProfiles;
  },

  sendTripMessage: async (tripId: string, message: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First verify the user can send messages (is participant or organizer)
    // Check for all possible status values that joinTrip might have used
    const { data: participation, error: partError } = await supabase
      .from('trip_participants')
      .select('id, status')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .in('status', ['joined', 'confirmed', 'accepted', 'active', 'pending'])
      .single();

    const { data: trip, error: tripError } = await supabase
      .from('group_trips')
      .select('organizer_id')
      .eq('id', tripId)
      .single();

    const canSendMessage = (!partError && participation) || (trip && trip.organizer_id === user.id);

    console.log('Chat permission check:', {
      tripId,
      userId: user.id,
      participation: participation ? { id: participation.id, status: participation.status } : null,
      partError: partError?.message,
      tripOrganizer: trip?.organizer_id,
      isOrganizer: trip?.organizer_id === user.id,
      canSendMessage,
      partErrorCode: partError?.code,
      tripError: tripError?.message
    });

    if (!canSendMessage) {
      console.error('❌ Chat permission denied. Details:', {
        hasParticipation: !!participation,
        participationStatus: participation?.status,
        isOrganizer: trip?.organizer_id === user.id,
        partError: partError?.message,
        tripError: tripError?.message
      });
      throw new Error('You must be a participant or organizer to send messages');
    }

    const { data, error } = await supabase
      .from('trip_chat_messages')
      .insert({
        trip_id: tripId,
        sender_id: user.id,
        message: message.trim()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Trip Image Management
  updateTripImages: async (tripId: string, images: string[]) => {
    const { data, error } = await supabase
      .from('group_trips')
      .update({ images })
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  // Generate unique username
  async generateUniqueUsername(baseName: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_unique_username', {
      base_name: baseName
    })
    
    if (error) {
      console.error('Error generating username:', error)
      // Fallback to simple method
      const timestamp = Date.now().toString().slice(-6)
      return `rider${timestamp}`
    }
    
    return data
  },

  // Sign up with email and password
  async signUp(data: RegisterData) {
    const { name, email, password, ...profileData } = data
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        }
      }
    })

    if (authError) {
      throw authError
    }

    // Create user profile after successful registration
    if (authData.user) {
      // Generate unique username
      const username = await this.generateUniqueUsername(name)
      
      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          username,
          display_name: name,
          bio: profileData.bio,
          experience: profileData.experience,
          favorite_type: profileData.favoriteType,
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }

      // Create user stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: authData.user.id,
        })

      if (statsError) {
        console.error('Error creating user stats:', statsError)
      }

      // Create initial bike if provided
      if (profileData.bikeBrand && profileData.bikeModel) {
        const { error: bikeError } = await supabase
          .from('user_bikes')
          .insert({
            user_id: authData.user.id,
            name: 'My Bike',
            brand: profileData.bikeBrand,
            model: profileData.bikeModel,
            year: profileData.bikeYear ? parseInt(profileData.bikeYear) : undefined,
            is_primary: true,
          })

        if (bikeError) {
          console.error('Error creating user bike:', bikeError)
        }
      }
    }

    return authData
  },

  // Sign in with email and password
  async signIn(data: LoginData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      throw error
    }

    return authData
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      throw error
    }

    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return user
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw error
    }

    return data
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Add or update user bike
  async upsertUserBike(userId: string, bikeData: Partial<UserBike>) {
    const { data, error } = await supabase
      .from('user_bikes')
      .upsert({
        ...bikeData,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Delete user bike
  async deleteUserBike(userId: string, bikeId: string) {
    const { error } = await supabase
      .from('user_bikes')
      .delete()
      .eq('id', bikeId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  },

  // Add user bike
  async addUserBike(userId: string, bikeData: Partial<UserBike>) {
    const { data, error } = await supabase
      .from('user_bikes')
      .insert({
        ...bikeData,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Update user bike
  async updateUserBike(userId: string, bikeId: string, bikeData: Partial<UserBike>) {
    const { data, error } = await supabase
      .from('user_bikes')
      .update(bikeData)
      .eq('id', bikeId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Create profile for social login users
  async createUserProfile(userId: string, data: UserProfileData) {
    // Generate unique username if not provided
    const username = data.username || await this.generateUniqueUsername(data.display_name)

    // Sync Google profile picture if user signed up with Google
    const googleProfileData = await this.getGoogleProfileData(userId)
    const avatarUrl = data.avatar_url || googleProfileData?.avatar_url

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        username,
        display_name: data.display_name || googleProfileData?.display_name || 'New Rider',
        bio: data.bio,
        avatar_url: avatarUrl,
        location: data.location,
        experience: data.experience,
        favorite_type: data.favorite_type,
        website_url: data.website_url,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create user stats
    await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
      })

    return profile
  },

  // Get Google profile data from user metadata
  async getGoogleProfileData(userId: string): Promise<{ avatar_url?: string; display_name?: string } | null> {
    try {
      // Get the current user to access their metadata
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.warn('Could not get user for Google profile sync:', error)
        return null
      }

      // Check if user signed up with Google
      const googleIdentity = user.identities?.find(identity => identity.provider === 'google')

      if (!googleIdentity) {
        return null // Not a Google user
      }

      // Extract Google profile data from user metadata
      const userMetadata = user.user_metadata || {}
      const googleMetadata = googleIdentity.identity_data || {}

      // Google provides profile picture in different places depending on the flow
      const avatarUrl = userMetadata.avatar_url ||
                       userMetadata.picture ||
                       googleMetadata.avatar_url ||
                       googleMetadata.picture

      const displayName = userMetadata.full_name ||
                         userMetadata.name ||
                         googleMetadata.full_name ||
                         googleMetadata.name ||
                         userMetadata.display_name

      if (avatarUrl || displayName) {
        console.log('Found Google profile data for user:', userId, {
          hasAvatar: !!avatarUrl,
          hasDisplayName: !!displayName
        })

        return {
          avatar_url: avatarUrl,
          display_name: displayName
        }
      }

      return null
    } catch (error) {
      console.warn('Error getting Google profile data:', error)
      return null
    }
  },

  // Sync Google profile data for existing users
  async syncGoogleProfile(userId: string) {
    try {
      const googleData = await this.getGoogleProfileData(userId)

      if (!googleData) {
        return null // No Google data to sync
      }

      // Update existing profile with Google data (only if fields are empty)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('avatar_url, display_name')
        .eq('user_id', userId)
        .single()

      if (!existingProfile) {
        console.warn('Profile not found for Google sync:', userId)
        return null
      }

      const updates: any = {}

      // Only update if the field is currently empty/null
      if (!existingProfile.avatar_url && googleData.avatar_url) {
        updates.avatar_url = googleData.avatar_url
      }

      if (!existingProfile.display_name && googleData.display_name) {
        updates.display_name = googleData.display_name
      }

      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) {
          console.error('Error syncing Google profile:', error)
          return null
        }

        console.log('Successfully synced Google profile data for user:', userId, updates)
        return data
      }

      return null // No updates needed
    } catch (error) {
      console.error('Error in syncGoogleProfile:', error)
      return null
    }
  },

  // Get user profile by username
  async getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  },

  // Get user stats
  async getUserStats(userId: string): Promise<UserStats | null> {
    // Get accurate counts directly from relationships
    const [followerCount, followingCount] = await Promise.all([
      this.getFollowerCount(userId),
      this.getFollowingCount(userId)
    ])

    // Get other stats from user_stats table
    const { data: existingStats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const stats = existingStats || { user_id: userId }

    // Update with accurate counts
    const updatedStats = {
      ...stats,
      followers_count: followerCount,
      following_count: followingCount
    }

    // Update the stored stats with accurate counts
    await supabase
      .from('user_stats')
      .upsert(updatedStats, { onConflict: 'user_id' })

    return updatedStats
  },

  // Get user bikes
  async getUserBikes(userId: string): Promise<UserBike[]> {
    const { data, error } = await supabase
      .from('user_bikes')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  },

  // Get user adventures
  async getUserAdventures(userId: string, isPublic: boolean = true): Promise<UserAdventure[]> {
    let query = supabase
      .from('user_adventures')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (isPublic) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  },

  // Get user posts
  async getUserPosts(userId: string, isPublic: boolean = true): Promise<UserPost[]> {
    let query = supabase
      .from('user_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (isPublic) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // ================================
  // POSTS AND FEED FUNCTIONS
  // ================================

  // Get global feed posts
  async getGlobalFeed(limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      console.log('🔍 [DEBUG] Fetching global feed...')
      
      // First, try without joins to see if basic query works
      const { data: postsData, error: postsError } = await supabase
        .from('user_posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        console.error('❌ [DEBUG] Basic user_posts query failed:', postsError)
        return []
      }

      console.log('✅ [DEBUG] Basic posts query successful, got', postsData?.length || 0, 'posts')

      if (!postsData || postsData.length === 0) {
        console.log('ℹ️ [DEBUG] No posts found')
        return []
      }

      // Now try to get user profiles separately
      const userIds = [...new Set(postsData.map(post => post.user_id))]
      console.log('🔍 [DEBUG] Fetching profiles for user IDs:', userIds)

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds)

      if (profilesError) {
        console.error('❌ [DEBUG] Profiles query failed:', profilesError)
        // Return posts without profiles
        return postsData.map(post => ({
          ...post,
          user_profiles: {
            username: 'unknown',
            display_name: 'Anonymous User',
            avatar_url: null
          }
        }))
      }

      console.log('✅ [DEBUG] Profiles query successful, got', profilesData?.length || 0, 'profiles')

      // Merge posts with profiles
      const postsWithProfiles = postsData.map(post => {
        const profile = profilesData?.find(p => p.user_id === post.user_id)
        return {
          ...post,
          user_profiles: profile || {
            username: 'unknown',
            display_name: 'Anonymous User',
            avatar_url: null
          }
        }
      })

      console.log('✅ [DEBUG] Successfully merged posts with profiles')
      return postsWithProfiles

    } catch (error) {
      console.error('💥 [DEBUG] Global feed error:', error)
      return []
    }
  },

  // Create a new post
  async createPost(userId: string, postData: {
    caption: string
    images: string[]
    location?: string
    tags?: string[]
    adventure_id?: string
    bike_id?: string
    is_public?: boolean
  }) {
    const { data, error } = await supabase
      .from('user_posts')
      .insert({
        user_id: userId,
        ...postData,
        is_public: postData.is_public ?? true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Like/unlike a post
  async togglePostLike(userId: string, postId: string): Promise<boolean> {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      if (error) throw error
      return false
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({ user_id: userId, post_id: postId })

      if (error) throw error
      return true
    }
  },

  // Get post likes status for user
  async getPostLikeStatus(userId: string, postIds: string[]): Promise<Record<string, boolean>> {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (error) {
      throw error
    }

    const likedPosts: Record<string, boolean> = {}
    postIds.forEach(id => likedPosts[id] = false)
    data?.forEach(like => likedPosts[like.post_id] = true)

    return likedPosts
  },

  // Add comment to post
  async addPostComment(userId: string, postId: string, comment: string, parentCommentId?: string) {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        comment,
        parent_comment_id: parentCommentId
      })
      .select(`
        *,
        user_profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Get post comments
  async getPostComments(postId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user_profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  },

  // ================================
  // USER SEARCH FUNCTIONS
  // ================================

  // Search users by username or display name
  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      throw error
    }

    return data || []
  },

  // ================================
  // MESSAGES AND CHAT FUNCTIONS
  // ================================

  // Get chat conversations for user
  async getUserConversations(userId: string): Promise<any[]> {
    // Return dummy data for now until chat tables are properly set up
    return [
      { id: "1", name: "Alpine Riders", lastMessage: "Great photos from yesterday!", time: "10m", unread: 3 },
      { id: "2", name: "BMW Adventure Club", lastMessage: "Next meetup confirmed for...", time: "1h", unread: 0 },
      { id: "3", name: "Off-Road Warriors", lastMessage: "Trail conditions update", time: "2h", unread: 5 },
      { id: "4", name: "Weekend Cruisers", lastMessage: "Anyone up for a Sunday ride?", time: "4h", unread: 1 }
    ]
  },

  // ================================
  // CHAT FUNCTIONS (NEW)
  // ================================

  // Create a new chat room
  async createChatRoom(userId: string, roomData: {
    name: string
    description?: string
    isGroup: boolean
    participantIds: string[]
  }) {
    try {
      // Create the room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomData.name,
          description: roomData.description,
          is_group: roomData.isGroup,
          created_by: userId
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add participants
      const participants = [userId, ...roomData.participantIds].map(participantId => ({
        room_id: room.id,
        user_id: participantId,
        is_admin: participantId === userId
      }))

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      return room
    } catch (error) {
      console.error('Error creating chat room:', error)
      throw error
    }
  },

  // Send a message
  async sendMessage(userId: string, roomId: string, content: string, messageType: string = 'text', mediaUrl?: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: userId,
          content,
          message_type: messageType,
          media_url: mediaUrl
        })
        .select(`
          *,
          user_profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // Get messages for a room
  async getRoomMessages(roomId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user_profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  },

  // ================================
  // NOTIFICATIONS FUNCTIONS (NEW)
  // ================================

  // Create notification
  async createNotification(data: {
    userId: string
    actorId: string
    type: string
    title: string
    message: string
    entityType?: string
    entityId?: string
  }) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          actor_id: data.actorId,
          type: data.type,
          title: data.title,
          message: data.message,
          entity_type: data.entityType,
          entity_id: data.entityId
        })

      if (error) throw error
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:user_profiles!notifications_actor_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserNotifications:', error)
      return []
    }
  },

  // Mark notification as read
  async markNotificationRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  // ================================
  // TRIPS FUNCTIONS (NEW)
  // ================================





  // ================================
  // ACTIVITY AND NOTIFICATIONS
  // ================================

  // Get recent activity for user
  async getUserActivity(userId: string, limit: number = 10): Promise<any[]> {
    try {
      console.log('🔍 [DEBUG] Fetching user activity for user:', userId)
      
      // Check if post_likes table exists
      const { data: testLikes, error: testError } = await supabase
        .from('post_likes')
        .select('id')
        .limit(1)

      if (testError) {
        console.log('ℹ️ [DEBUG] post_likes table does not exist:', testError)
        console.log('ℹ️ [DEBUG] Returning empty activity array')
        return []
      }

      console.log('✅ [DEBUG] post_likes table exists')

      // Get user's posts first
      const { data: userPosts, error: postsError } = await supabase
        .from('user_posts')
        .select('id')
        .eq('user_id', userId)

      if (postsError) {
        console.error('❌ [DEBUG] Failed to get user posts:', postsError)
        return []
      }

      console.log('✅ [DEBUG] User posts query successful, got', userPosts?.length || 0, 'posts')

      if (!userPosts || userPosts.length === 0) {
        console.log('ℹ️ [DEBUG] User has no posts, no activity to show')
        return []
      }

      const postIds = userPosts.map(post => post.id)
      console.log('🔍 [DEBUG] Looking for likes on posts:', postIds)

      // Get likes on user's posts (without joins first)
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('created_at, user_id')
        .in('post_id', postIds)
        .neq('user_id', userId) // Don't show user's own likes
        .order('created_at', { ascending: false })
        .limit(limit)

      if (likesError) {
        console.error('❌ [DEBUG] Failed to get likes:', likesError)
        return []
      }

      console.log('✅ [DEBUG] Likes query successful, got', likesData?.length || 0, 'likes')

      if (!likesData || likesData.length === 0) {
        console.log('ℹ️ [DEBUG] No likes found on user posts')
        return []
      }

      // Get user profiles for the likers
      const userIds = [...new Set(likesData.map(like => like.user_id))]
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds)

      console.log('✅ [DEBUG] Profiles query successful, got', profilesData?.length || 0, 'profiles')

      // Build activity array
      const activities = likesData.map(like => {
        const profile = profilesData?.find(p => p.user_id === like.user_id)
        return {
          type: 'like',
          user: profile?.display_name || 'Someone',
          action: 'liked your post',
          time: this.formatTimeAgo(like.created_at),
          avatar_url: profile?.avatar_url || null,
          created_at: like.created_at
        }
      })

      console.log('✅ [DEBUG] Successfully built activity array with', activities.length, 'items')
      return activities.slice(0, limit)

    } catch (error) {
      console.error('💥 [DEBUG] Error fetching user activity:', error)
      return []
    }
  },

  // ================================
  // STORIES FUNCTIONS
  // ================================

  // Get user stories (for now, return recent adventures as stories)
  async getUserStories(userId: string): Promise<any[]> {
    try {
      console.log('🔍 [DEBUG] Fetching user stories...')
      
      // Check if user_adventures table exists by trying a simple query
      const { data, error } = await supabase
        .from('user_adventures')
        .select('id')
        .limit(1)

      if (error) {
        console.log('ℹ️ [DEBUG] user_adventures table does not exist or is not accessible:', error)
        console.log('ℹ️ [DEBUG] Returning empty stories array')
        return []
      }

      console.log('✅ [DEBUG] user_adventures table exists')

      // Now try to fetch actual stories
      const { data: adventuresData, error: adventuresError } = await supabase
        .from('user_adventures')
        .select('*')
        .eq('is_public', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (adventuresError) {
        console.error('❌ [DEBUG] Adventures query failed:', adventuresError)
        return []
      }

      console.log('✅ [DEBUG] Adventures query successful, got', adventuresData?.length || 0, 'adventures')

      if (!adventuresData || adventuresData.length === 0) {
        console.log('ℹ️ [DEBUG] No featured adventures found')
        return []
      }

      // Get user profiles separately
      const userIds = [...new Set(adventuresData.map(adventure => adventure.user_id))]
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds)

      // Merge adventures with profiles
      const adventuresWithProfiles = adventuresData.map(adventure => {
        const profile = profilesData?.find(p => p.user_id === adventure.user_id)
        return {
          ...adventure,
          user_profiles: profile || {
            username: 'unknown',
            display_name: 'Anonymous User',
            avatar_url: null
          }
        }
      })

      console.log('✅ [DEBUG] Successfully merged adventures with profiles')
      return adventuresWithProfiles

    } catch (error) {
      console.error('💥 [DEBUG] Stories error:', error)
      return []
    }
  },

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  // Format time ago
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  },

  // ================================
  // FOLLOW/UNFOLLOW FUNCTIONALITY
  // ================================

  async followUser(followingId: string) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('User not authenticated')

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (existingFollow) {
      throw new Error('Already following this user')
    }

    // Insert the follow relationship
    const { data, error } = await supabase
      .from('user_followers')
      .insert({
        follower_id: user.id,
        following_id: followingId
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update follower count for the followed user by counting actual relationships
    const { count: followerCount } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId)

    await supabase
      .from('user_stats')
      .upsert({
        user_id: followingId,
        followers_count: followerCount || 0
      }, { onConflict: 'user_id' })

    // Update following count for the follower by counting actual relationships
    const { count: followingCount } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        following_count: followingCount || 0
      }, { onConflict: 'user_id' })

    console.log(`Follow relationship created: ${user.id} -> ${followingId}`)
    return data
  },

  async unfollowUser(followingId: string) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('User not authenticated')

    // Check if actually following before unfollowing
    const { data: existingFollow } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (!existingFollow) {
      throw new Error('Not following this user')
    }

    // Delete the follow relationship
    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (error) {
      throw error
    }

    // Update follower count for the unfollowed user by counting actual relationships
    const { count: followerCount } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId)

    await supabase
      .from('user_stats')
      .upsert({
        user_id: followingId,
        followers_count: followerCount || 0
      }, { onConflict: 'user_id' })

    // Update following count for the unfollower by counting actual relationships
    const { count: followingCount } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        following_count: followingCount || 0
      }, { onConflict: 'user_id' })

    console.log(`Unfollow relationship removed: ${user.id} -> ${followingId}`)
    return true
  },

  async checkFollowStatus(followingId: string): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return false

    const { data, error } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return !!data
  },

  async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (error) {
      console.error('Error getting follower count:', error)
      return 0
    }

    return count || 0
  },

  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (error) {
      console.error('Error getting following count:', error)
      return 0
    }

    return count || 0
  },

  // ================================
  // TRIP FUNCTIONALITY
  // ================================

  async createTrip(tripData: any) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('group_trips')
      .insert({
        organizer_id: user.id,
        title: tripData.title,
        description: tripData.description,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        start_location: tripData.startLocation,
        end_location: tripData.endLocation,
        distance: tripData.estimatedDistance ? parseInt(tripData.estimatedDistance) : null,
        difficulty: tripData.difficulty,
        max_participants: tripData.maxParticipants ? parseInt(tripData.maxParticipants) : 10,
        estimated_cost: tripData.estimatedCost,
        requirements: tripData.requirements,
        included_services: tripData.included || [],
        waypoints: tripData.waypoints,
        fuel_stops: tripData.fuelStops,
        accommodation_type: tripData.accommodationType,
        meals_included: tripData.mealsIncluded,
        emergency_contact: tripData.emergencyContact,
        is_public: true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Automatically add organizer as participant
    await supabase
      .from('trip_participants')
      .insert({
        trip_id: data.id,
        user_id: user.id
      })

    return data
  },

  async getPublicTrips(limit: number = 20, offset: number = 0) {
    try {
      // Quick check if table exists
      const { error: testError } = await supabase
        .from('group_trips')
        .select('count', { count: 'exact', head: true })

      if (testError) {
        console.error('group_trips table not accessible:', testError)
        return []
      }

      // Get the trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('group_trips')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (tripsError) {
        console.error('Error fetching trips:', tripsError)
        throw tripsError
      }

      if (!tripsData || tripsData.length === 0) {
        return []
      }

      // Get organizer profiles separately
      const organizerIds = tripsData.map(trip => trip.organizer_id)

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', organizerIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Return trips without profiles
        return tripsData.map(trip => ({
          ...trip,
          organizer: {
            username: 'unknown',
            display_name: 'Anonymous Organizer',
            avatar_url: null
          }
        }))
      }

      // Merge trips with profiles
      const tripsWithProfiles = tripsData.map(trip => {
        const profile = profilesData?.find(p => p.user_id === trip.organizer_id)
        return {
          ...trip,
          organizer: profile || {
            username: 'unknown',
            display_name: 'Anonymous Organizer',
            avatar_url: null
          }
        }
      })

      return tripsWithProfiles
    } catch (error) {
      console.error('Error in getPublicTrips:', error)
      return []
    }
  },

  async getTripById(tripId: string) {
    try {
      // Get the trip first
      const { data: tripData, error: tripError } = await supabase
        .from('group_trips')
        .select('*')
        .eq('id', tripId)
        .single()

      if (tripError) {
        console.error('Error fetching trip:', tripError)
        throw tripError
      }

      // Get organizer profile
      const { data: organizerProfile, error: organizerError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', tripData.organizer_id)
        .single()

      // Get participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('trip_participants')
        .select(`
          user_id,
          joined_at,
          status
        `)
        .eq('trip_id', tripId)

      // Get participant profiles if there are participants
      let participantProfiles = []
      if (participantsData && participantsData.length > 0) {
        const participantIds = participantsData.map(p => p.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', participantIds)

        if (!profilesError && profiles) {
          participantProfiles = profiles
        }
      }

      // Merge participants with profiles
      const participants = participantsData?.map(participant => {
        const profile = participantProfiles.find(p => p.user_id === participant.user_id)
        return {
          ...participant,
          user_profiles: profile || {
            username: 'unknown',
            display_name: 'Anonymous User',
            avatar_url: null
          }
        }
      }) || []

      return {
        ...tripData,
        organizer: organizerProfile || {
          user_id: tripData.organizer_id,
          username: 'unknown',
          display_name: 'Anonymous Organizer',
          avatar_url: null
        },
        participants
      }
    } catch (error) {
      console.error('Error in getTripById:', error)
      throw error
    }
  },

  async joinTrip(tripId: string) {
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('User not authenticated')

      // First verify the trip exists and get its details
      const { data: trip, error: tripError } = await supabase
        .from('group_trips')
        .select('id, max_participants, current_participants, status, title')
        .eq('id', tripId)
        .single()

      if (tripError) {
        console.error('Trip lookup failed:', tripError)
        throw new Error(`Trip not found: ${tripId}`)
      }

      if (trip.status !== 'open') {
        throw new Error('Trip is not open for new participants')
      }

      if (trip.current_participants >= trip.max_participants) {
        throw new Error('Trip is full')
      }

      // Check if user is already a participant
      const { data: existingParticipation, error: checkError } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking participation:', checkError);
        // Don't throw here, continue with insert attempt
      }

      if (existingParticipation) {
        throw new Error('You are already a participant in this trip')
      }

      // Double-check that the trip still exists before inserting
      const { data: verifyTrip, error: verifyError } = await supabase
        .from('group_trips')
        .select('id, title')
        .eq('id', tripId)
        .single();

      if (verifyError) {
        console.error('Trip verification failed:', verifyError);
        throw new Error(`Trip verification failed: ${verifyError.message}`);
      }

      // Try different status values since the check constraint might not allow 'joined'
      let insertData = null;
      let insertError = null;
      const statusValues = ['joined', 'confirmed', 'accepted', 'active'];

      for (const statusValue of statusValues) {
        console.log(`Trying to join with status: ${statusValue}`);
        const { data, error } = await supabase
          .from('trip_participants')
          .insert({
            trip_id: tripId,
            user_id: user.id,
            status: statusValue
          })
          .select()
          .single();

        if (!error) {
          insertData = data;
          console.log(`Successfully joined with status: ${statusValue}`);
          break;
        }

        insertError = error;
        console.warn(`Status "${statusValue}" failed:`, error.message);

        // If it's not a check constraint error, break immediately
        if (error.code !== '23514') {
          break;
        }
      }

      if (!insertData) {
        console.error('All status values failed:', insertError);

        // If it's a foreign key constraint error, provide more specific error
        if (insertError.code === '23503' && insertError.message.includes('trip_participants_trip_id_fkey')) {
          console.error('Foreign key constraint violation - trip ID not found in group_trips table');
          throw new Error(`Trip with ID ${tripId} does not exist in the database. Please refresh the page.`);
        }

        // If it's a check constraint error, provide helpful message
        if (insertError.code === '23514') {
          throw new Error('Unable to join trip due to status validation. The trip may have specific requirements. Please contact the organizer.');
        }

        throw insertError;
      }

      return insertData
    } catch (error) {
      console.error('Error in joinTrip:', error)
      throw error
    }
  },

  async leaveTrip(tripId: string) {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('trip_participants')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return true
  },

  async checkTripParticipation(tripId: string): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return false

    const { data, error } = await supabase
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  },

  async getUserTrips(userId: string) {
    try {
      // Get user's trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('group_trips')
        .select('*')
        .eq('organizer_id', userId)
        .order('start_date', { ascending: true })

      if (tripsError) {
        console.error('Error fetching user trips:', tripsError)
        throw tripsError
      }

      console.log(`getUserTrips: Found ${tripsData?.length || 0} trips for user ${userId}`)

      // Get organizer profile (should be the user's own profile)
      const { data: organizerProfile, error: organizerError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', userId)
        .single()

      // Add organizer info to each trip
      const tripsWithOrganizer = tripsData?.map(trip => ({
        ...trip,
        organizer: organizerProfile || {
          user_id: userId,
          username: 'unknown',
          display_name: 'Anonymous Organizer',
          avatar_url: null
        }
      })) || []

      console.log(`getUserTrips: Returning ${tripsWithOrganizer.length} trips with organizer info`)
      return tripsWithOrganizer
    } catch (error) {
      console.error('Error in getUserTrips:', error)
      throw error
    }
  },

  async getUserJoinedTrips(userId: string) {
    try {
      // Get user's trip participations (include all possible status values)
      // This matches the status values tried in joinTrip function
      const { data: participations, error: participationsError } = await supabase
        .from('trip_participants')
        .select(`
          trip_id,
          joined_at,
          status
        `)
        .eq('user_id', userId)
        .in('status', ['joined', 'confirmed', 'accepted', 'active', 'pending'])

      if (participationsError) {
        console.error('Error fetching participations:', participationsError)
        throw participationsError
      }

      console.log(`getUserJoinedTrips: Found ${participations?.length || 0} participations`)
      if (participations && participations.length > 0) {
        const statusCount = participations.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        console.log(`getUserJoinedTrips: Status breakdown:`, statusCount);
      }

      if (!participations || participations.length === 0) {
        console.log(`getUserJoinedTrips: No participations found for user ${userId} (checked statuses: joined, confirmed, accepted, active, pending)`)
        return []
      }

      // Get the actual trip data
      const tripIds = participations.map(p => p.trip_id)
      console.log(`getUserJoinedTrips: Fetching details for trip IDs:`, tripIds)

      const { data: tripsData, error: tripsError } = await supabase
        .from('group_trips')
        .select('*')
        .in('id', tripIds)

      if (tripsError) {
        console.error('Error fetching trips:', tripsError)
        throw tripsError
      }

      console.log(`getUserJoinedTrips: Found ${tripsData?.length || 0} trip details for user ${userId}`)

      // Get organizer profiles
      const organizerIds = tripsData?.map(trip => trip.organizer_id) || []
      const { data: organizerProfiles, error: organizerError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', organizerIds)

      // Merge trips with organizer info
      const tripsWithOrganizers = tripsData?.map(trip => {
        const organizerProfile = organizerProfiles?.find(p => p.user_id === trip.organizer_id)
        return {
          ...trip,
          organizer: organizerProfile || {
            user_id: trip.organizer_id,
            username: 'unknown',
            display_name: 'Anonymous Organizer',
            avatar_url: null
          }
        }
      }) || []

      console.log(`getUserJoinedTrips: Returning ${tripsWithOrganizers.length} joined trips`)
      return tripsWithOrganizers
    } catch (error) {
      console.error('Error in getUserJoinedTrips:', error)
      throw error
    }
  }
}

