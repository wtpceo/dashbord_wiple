import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // URL과 Key가 모두 있을 때만 클라이언트 생성
    if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return supabaseInstance;
};

// 타입 정의
export interface Database {
  public: {
    Tables: {
      dashboard_data: {
        Row: {
          id: string;
          data: any;
          updated_at: string;
        };
        Insert: {
          id?: string;
          data: any;
          updated_at?: string;
        };
        Update: {
          id?: string;
          data?: any;
          updated_at?: string;
        };
      };
    };
  };
}

