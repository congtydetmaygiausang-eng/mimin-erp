#!/usr/bin/env node
/**
 * Script apply SQL migrations lên Supabase
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY="eyJ..." node scripts/apply-migrations.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nftlwdcsmlpeiazhuoho.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Thiếu SERVICE_ROLE_KEY!');
  console.error('Set: export SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runSQL(sql) {
  // Supabase không cho chạy raw SQL qua PostgREST
  // Cần dùng pg connection trực tiếp
  // Workaround: gọi thông qua Edge Function (nếu có) hoặc dùng psql
  console.log('⚠️ Supabase JS client không thể chạy raw SQL');
  console.log('→ A cần chạy SQL thủ công trong SQL Editor');
  console.log('→ Hoặc dùng psql với connection string');
  return { error: 'NOT_SUPPORTED' };
}

async function verify() {
  console.log('\n🔍 Verify tables...');
  const tables = ['users', 'tasks', 'kho', 'cong_no', 'nha_cung_cap', 'khach_hang_si', 'xuong_gia_cong'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`   ❌ ${t}: ${error.message}`);
    } else {
      console.log(`   ✅ ${t}: ${count} rows`);
    }
  }
}

async function main() {
  console.log('🚀 MIMIN ERP - Supabase Status');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Service key: ${SERVICE_ROLE_KEY.slice(0, 30)}...`);
  
  // Test connection
  const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
  if (error) {
    console.log(`\n❌ Connection error: ${error.message}`);
    if (error.message.includes('does not exist')) {
      console.log('\n→ Bảng users chưa tồn tại. Cần chạy SQL migrations trước.');
      console.log('→ A mở: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new');
      console.log('→ Copy nội dung supabase-migrations/001_init_schema.sql → Run');
      console.log('→ Tạo query mới → Copy supabase-migrations/002_seed_data.sql → Run');
    }
  } else {
    console.log(`\n✅ Connection OK. Users table có ${data} rows`);
  }
  
  await verify();
}

main().catch(console.error);
