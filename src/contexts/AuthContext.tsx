import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { authService } from '@/lib/auth'
import type { UserProfile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  needsOnboarding: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [lastAuthEvent, setLastAuthEvent] = useState<{event: string, userId: string, timestamp: number} | null>(null)
  const [lastKnownUser, setLastKnownUser] = useState<User | null>(null)

  const checkSocialLogin = (user: User): boolean => {
    // Check if user signed up via social provider (not email/password)
    const identities = user.identities || []
    return identities.some(identity => identity.provider !== 'email')
  }

  useEffect(() => {
    let mounted = true
    let hasInitialized = false

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Starting initial auth session check...')
        const currentUser = await authService.getCurrentUser()
        
        if (!mounted) return
        
        console.log('Initial session check complete, user:', currentUser?.id || 'none')
        setUser(currentUser)
        if (currentUser) {
          setLastKnownUser(currentUser)
        }
        
        if (currentUser) {
          console.log('Fetching user profile for:', currentUser.id)
          let userProfile = await authService.getUserProfile(currentUser.id)
          console.log('User profile fetched:', userProfile?.username || 'none')

          // For social logins, try to sync Google profile data if profile exists but might be missing Google data
          const isSocialLogin = checkSocialLogin(currentUser)
          if (isSocialLogin && userProfile) {
            console.log('Checking for Google profile sync for existing user:', currentUser.id)
            const syncedProfile = await authService.syncGoogleProfile(currentUser.id)
            if (syncedProfile) {
              userProfile = syncedProfile
              console.log('Google profile data synced for existing user')
            }
          }

          setProfile(userProfile)

          // Only set onboarding needed if it's a social login AND no profile exists
          setNeedsOnboarding(isSocialLogin && !userProfile)
        } else {
          setProfile(null)
          setNeedsOnboarding(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Set user to null on error to stop loading
        setUser(null)
        setProfile(null)
        setNeedsOnboarding(false)
      } finally {
        if (mounted && !hasInitialized) {
          hasInitialized = true
          setLoading(false)
          setInitialLoad(false)
          console.log('Auth initialization complete')
        }
      }
    }

    // Add timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading && !hasInitialized) {
        console.warn('Auth initialization timeout, setting loading to false')
        hasInitialized = true
        setLoading(false)
        setInitialLoad(false)
      }
    }, 5000) // Reduced to 5 second timeout

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state change:', event, session?.user?.id)
      
      // If we haven't initialized yet, let the initial session handle it
      if (!hasInitialized && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('Deferring to initial session handling')
        return
      }
      
      // Ignore auth state changes when page is not visible (prevents tab switch issues)
      if (typeof document !== 'undefined' && document.hidden) {
        console.log('Page is hidden, ignoring auth state change:', event)
        return
      }
      
      // Skip processing if this is the same user we already have (prevents duplicate loading)
      const currentUserId = user?.id || lastKnownUser?.id
      const newUserId = session?.user?.id
      
      // Debounce: Skip if same event for same user happened recently (within 1 second)
      const now = Date.now()
      if (lastAuthEvent && 
          lastAuthEvent.event === event && 
          lastAuthEvent.userId === newUserId && 
          now - lastAuthEvent.timestamp < 1000) {
        console.log('Debouncing duplicate auth event:', event, 'for user:', newUserId)
        return
      }
      
      // Update last auth event
      if (newUserId) {
        setLastAuthEvent({ event, userId: newUserId, timestamp: now })
      }
      
      // DEBUG: Add detailed logging to understand what's happening
      console.log('Auth state change debug:', {
        event,
        hasInitialized,
        currentUserId,
        lastKnownUserId: lastKnownUser?.id,
        newUserId,
        sameUser: currentUserId === newUserId
      });
      
      // More robust duplicate prevention - check if this is truly a meaningful change
      const isSameUserEvent = hasInitialized && currentUserId === newUserId && currentUserId;
      const isMeaningfulSignIn = event === 'SIGNED_IN' && (!currentUserId || currentUserId !== newUserId);
      
      // CRITICAL FIX: If we have the same user ID, don't treat it as a new sign-in
      // even if currentUserId is undefined due to state reset
      const isSameUser = newUserId && (currentUserId === newUserId || 
        (hasInitialized && !currentUserId && newUserId && event === 'SIGNED_IN'));
      
      if (isSameUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('Skipping auth event - same user detected:', newUserId, 'event:', event, 'currentUserId was:', currentUserId)
        return
      }
      
      // Handle token refresh without loading
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, no loading needed')
        return
      }
      
      // Only show loading for meaningful state changes
      const isSignOut = event === 'SIGNED_OUT'
      const shouldShowLoading = hasInitialized && (isSignOut || isMeaningfulSignIn);
      
      if (shouldShowLoading) {
        console.log('Setting loading for auth state change:', event, 'meaningful sign in:', isMeaningfulSignIn)
        setLoading(true)
      } else if (hasInitialized && event === 'SIGNED_IN') {
        console.log('Skipping loading for duplicate SIGNED_IN event')
      }
      
      const newUser = session?.user ?? null
      setUser(newUser)
      
      // Preserve the last known user for comparison purposes
      if (newUser) {
        setLastKnownUser(newUser)
      }
      
      if (session?.user) {
        try {
          let userProfile = await authService.getUserProfile(session.user.id)

          // If no profile exists but it's a social login, try to sync Google profile
          const isSocialLogin = checkSocialLogin(session.user)
          if (isSocialLogin && !userProfile) {
            console.log('Attempting to sync Google profile for new user:', session.user.id)
            const syncedProfile = await authService.syncGoogleProfile(session.user.id)
            if (syncedProfile) {
              userProfile = syncedProfile
              console.log('Google profile synced successfully')
            }
          }

          setProfile(userProfile)
          setNeedsOnboarding(isSocialLogin && !userProfile)
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setProfile(null)

          // Only show onboarding for social logins
          const isSocialLogin = checkSocialLogin(session.user)
          setNeedsOnboarding(isSocialLogin)
        }
      } else {
        setProfile(null)
        setNeedsOnboarding(false)
      }
      
      if (mounted && hasInitialized && (isSignOut || isMeaningfulSignIn)) {
        console.log('Clearing loading after auth state change')
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      await authService.signOut()
      console.log('Sign out successful')
      setUser(null)
      setProfile(null)
      setNeedsOnboarding(false)
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, clear the local state
      setUser(null)
      setProfile(null)
      setNeedsOnboarding(false)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await authService.getUserProfile(user.id)
        setProfile(userProfile)
        
        // Only set onboarding needed if it's a social login AND no profile exists
        const isSocialLogin = checkSocialLogin(user)
        setNeedsOnboarding(isSocialLogin && !userProfile)
      } catch (error) {
        console.error('Error refreshing profile:', error)
      }
    }
  }

  const value = {
    user,
    profile,
    loading,
    needsOnboarding,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
