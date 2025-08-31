import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  location?: string
  experience?: string
  favorite_type?: string
  website_url?: string
  created_at: string
  updated_at: string
}

export interface UserStats {
  id: string
  user_id: string
  total_miles: number
  total_adventures: number
  total_posts: number
  followers_count: number
  following_count: number
  miles_this_month: number
  miles_this_year: number
  adventures_this_month: number
  adventures_this_year: number
  riding_hours_total: number
  riding_hours_this_month: number
  riding_hours_this_year: number
  created_at: string
  updated_at: string
}

export interface UserBike {
  id: string
  user_id: string
  name: string
  brand: string
  model: string
  year?: number
  color?: string
  engine_size?: string
  engine_type?: string
  power?: string
  weight?: string
  fuel_capacity?: string
  image_url?: string
  modifications?: string[]
  is_primary: boolean
  purchase_date?: string
  mileage?: number
  created_at: string
  updated_at: string
}

export interface UserAdventure {
  id: string
  user_id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  distance?: number
  duration_days?: number
  difficulty?: string
  route_type?: string
  countries?: string[]
  bike_used?: string
  participants?: number
  max_elevation?: number
  total_riding_hours?: number
  weather_conditions?: string
  highlights?: string[]
  challenges?: string[]
  images?: string[]
  gpx_file_url?: string
  is_public: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

export interface UserPost {
  id: string
  user_id: string
  caption: string
  images: string[]
  adventure_id?: string
  bike_id?: string
  location?: string
  tags?: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      user_stats: {
        Row: UserStats
        Insert: Omit<UserStats, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserStats, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      user_bikes: {
        Row: UserBike
        Insert: Omit<UserBike, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserBike, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      user_adventures: {
        Row: UserAdventure
        Insert: Omit<UserAdventure, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserAdventure, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      user_posts: {
        Row: UserPost
        Insert: Omit<UserPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
