import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

