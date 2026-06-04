import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkwbixidpaqweavghfea.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrd2JpeGlkcGFxd2VhdmdoZmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjYxOTgsImV4cCI6MjA5MzM0MjE5OH0.JnpkukDVuPIvtlBZyHrPFzBReDIVEITrD0uAqGix77U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
