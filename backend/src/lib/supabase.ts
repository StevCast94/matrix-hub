import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ SUPABASE_URL o SUPABASE_SERVICE_KEY no configurados. Auth no funcionará.');
}

// Cliente admin con SERVICE key — usado SOLO en el backend para validar JWTs.
export const supabaseAdmin = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_KEY ?? '', {
  auth: { autoRefreshToken: false, persistSession: false },
});
