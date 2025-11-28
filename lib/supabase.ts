import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types will be generated later
export type Database = {
  public: {
    Tables: {
      users: any
      departments: any
      categories: any
      expense_reports: any
      receipts: any
      expenses: any
      audit_log: any
    }
  }
}
