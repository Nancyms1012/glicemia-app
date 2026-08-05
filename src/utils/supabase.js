import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymtiobihwezxhlmfxoci.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdGlvYmlod2V6eGhsbWZ4b2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjMyMzksImV4cCI6MjEwMTUzOTIzOX0.MU_tGbwaYYgRVAauvBeSi7lr9eEHaWFbZ-tPYPxoulQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
