import { Client } from 'pg';

const DATABASE_URL = "postgresql://postgres:HtUkba9rRPdDmigJ@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function test() {
  console.log("Connecting...");
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log("Connected successfully!");
    await client.end();
  } catch (e) {
    console.error("Connection failed:", e);
  }
}
test();
