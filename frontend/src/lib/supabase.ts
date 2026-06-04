import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hahvblhuksjrkbxjetpu.supabase.co'
const supabaseAnonKey = 'sb_publishable_yCkKjg-LOrkEg4QGWKTC-g_vcqA-orM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
