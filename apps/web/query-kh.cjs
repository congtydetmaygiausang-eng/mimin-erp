require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.from('khach_hang').select('*').limit(5).then(r => console.log(r.data));
