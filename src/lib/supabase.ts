import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebdcmiuzrrtmmphwxynw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZGNtaXV6cnJ0bW1waHd4eW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzAyMjksImV4cCI6MjA4NDg0NjIyOX0.QNInacY_9ZhDUhNmiYTXVccYNxc0kk71EsdME9AKJW0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
