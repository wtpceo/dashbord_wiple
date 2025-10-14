import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
  };

  return NextResponse.json(env);
}