'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [canRead, setCanRead] = useState<boolean | null>(null);
  const [canWrite, setCanWrite] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  const checkSupabaseConnection = async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus('❌ Supabase client not initialized - Check .env.local file');
      setError('Supabase client is null');
      return;
    }

    setStatus('✅ Supabase client initialized');

    // Check if table exists
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('id')
        .eq('id', 'test')
        .single();

      if (error && error.code === 'PGRST116') {
        setTableExists(false);
        setError('Table does not exist. Please run the SQL setup script.');
      } else if (error && error.code === 'PGRST204') {
        setTableExists(true);
        setCanRead(true);
      } else if (error) {
        setTableExists(false);
        setError(`Table check error: ${error.message}`);
      } else {
        setTableExists(true);
        setCanRead(true);
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message}`);
    }
  };

  const testWrite = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test write from Supabase test page'
      };

      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          id: 'test-write',
          data: testData
        });

      if (error) {
        setCanWrite(false);
        setError(`Write error: ${error.message}`);
      } else {
        setCanWrite(true);
        setError(null);
      }
    } catch (err: any) {
      setError(`Write test error: ${err.message}`);
    }
  };

  const createTable = async () => {
    const sqlScript = `
-- Create dashboard_data table
CREATE TABLE IF NOT EXISTS dashboard_data (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

-- Create policies for all users to read
CREATE POLICY "Enable read access for all users" ON dashboard_data
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for all users to insert
CREATE POLICY "Enable insert for all users" ON dashboard_data
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policies for all users to update
CREATE POLICY "Enable update for all users" ON dashboard_data
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON dashboard_data TO anon, authenticated;
    `;

    setError(`Please run this SQL in your Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Paste and run the SQL script above`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Supabase Connection Test</h1>

        <Card className="mb-6 bg-background-secondary border-white/10">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-white">Client Status:</span>
              <span className={status.includes('✅') ? 'text-green-500' : 'text-red-500'}>
                {status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white">Table Exists:</span>
              <span className={
                tableExists === null ? 'text-yellow-500' :
                tableExists ? 'text-green-500' : 'text-red-500'
              }>
                {tableExists === null ? '⏳ Checking...' :
                 tableExists ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white">Can Read:</span>
              <span className={
                canRead === null ? 'text-yellow-500' :
                canRead ? 'text-green-500' : 'text-red-500'
              }>
                {canRead === null ? '⏳ Not tested' :
                 canRead ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white">Can Write:</span>
              <span className={
                canWrite === null ? 'text-yellow-500' :
                canWrite ? 'text-green-500' : 'text-red-500'
              }>
                {canWrite === null ? '⏳ Not tested' :
                 canWrite ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button
            onClick={checkSupabaseConnection}
            className="btn-primary px-6 py-3 rounded-lg"
          >
            <span>Re-check Connection</span>
          </Button>

          <Button
            onClick={testWrite}
            className="btn-primary px-6 py-3 rounded-lg ml-4"
            disabled={!tableExists}
          >
            <span>Test Write Permission</span>
          </Button>

          {!tableExists && (
            <Button
              onClick={createTable}
              className="btn-primary px-6 py-3 rounded-lg ml-4"
            >
              <span>Show SQL Setup Script</span>
            </Button>
          )}
        </div>

        {error && (
          <Card className="mt-6 bg-red-900/20 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-500">Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-red-400 whitespace-pre-wrap text-sm">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 bg-blue-900/20 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-blue-400">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-white space-y-4">
            <p>If the table doesn't exist, follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to your Supabase Dashboard: https://supabase.com/dashboard</li>
              <li>Select your project (bdtacmmrytxanjfzahug)</li>
              <li>Click on "SQL Editor" in the left sidebar</li>
              <li>Copy the contents of /supabase_setup.sql file</li>
              <li>Paste it in the SQL editor and click "Run"</li>
              <li>Come back here and click "Re-check Connection"</li>
            </ol>

            <p className="mt-4 text-yellow-400">
              Important: The table must be created with the correct RLS policies
              for data to be shared between all users.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}