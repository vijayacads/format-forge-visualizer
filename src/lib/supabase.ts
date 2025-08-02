import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      templates: {
        Row: {
          id: string
          name: string
          type: string
          fields: any
          field_positions: any
          created_at: string
          updated_at: string
          created_by: string | null
          is_public: boolean
          share_token: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          fields: any
          field_positions?: any
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_public?: boolean
          share_token?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          fields?: any
          field_positions?: any
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_public?: boolean
          share_token?: string | null
        }
      }
      template_shares: {
        Row: {
          id: string
          template_id: string
          share_token: string
          created_at: string
          expires_at: string | null
          access_count: number
        }
        Insert: {
          id?: string
          template_id: string
          share_token: string
          created_at?: string
          expires_at?: string | null
          access_count?: number
        }
        Update: {
          id?: string
          template_id?: string
          share_token?: string
          created_at?: string
          expires_at?: string | null
          access_count?: number
        }
      }
    }
  }
} 