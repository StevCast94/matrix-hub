import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkwbixidpaqweavghfea.supabase.co'
const supabaseAnonKey = 'sb_publishable_IaoyokLmbA2brPTl7xOu_g_pY0489zH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
