const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:HtUkba9rRPdDmigJ@db.ejcuqyaiwabfygyesvxj.supabase.co:5432/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to Supabase.");

    const sql1 = `
      ALTER TABLE nhan_su ADD COLUMN IF NOT EXISTS id TEXT;
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    `;
    await client.query(sql1);
    console.log("Added id column and Grants.");

    const sql2 = `
      ALTER TABLE khach_hang ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow all for authenticated" ON khach_hang;
      DROP POLICY IF EXISTS "Allow all public" ON khach_hang;
      CREATE POLICY "Allow all public" ON khach_hang FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

      ALTER TABLE nha_cung_cap ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow all for authenticated" ON nha_cung_cap;
      DROP POLICY IF EXISTS "Allow all public" ON nha_cung_cap;
      CREATE POLICY "Allow all public" ON nha_cung_cap FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

      ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow all for authenticated" ON nhan_su;
      DROP POLICY IF EXISTS "Allow all public" ON nhan_su;
      CREATE POLICY "Allow all public" ON nhan_su FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

      ALTER TABLE xuong_gia_cong ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow all for authenticated" ON xuong_gia_cong;
      DROP POLICY IF EXISTS "Allow all public" ON xuong_gia_cong;
      CREATE POLICY "Allow all public" ON xuong_gia_cong FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
    `;
    await client.query(sql2);
    console.log("RLS Policies applied successfully.");

  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
