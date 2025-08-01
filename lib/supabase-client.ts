import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface ChatLog {
  id: string
  question: string
  answer: string
  created_at: string
}

export interface SymptomKnowledge {
  id: string
  symptom: string
  response: string
  embedding?: number[]
}
