const { createClient } = require("@supabase/supabase-js");

require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env.production' });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ejcuqyaiwabfygyesvxj.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJ..."
);
// I need the anon key! Where is it?
