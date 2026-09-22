const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseAnonKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
    .from("meinvoice_config")
    .upsert({
      id: "default",
      app_id: "71790D70-58EB-42AA-86EA-916FE1E91C75", // Dummy app ID
      tax_code: "0101243150-733",
      username: "hotrotichhopmisa@gmail.com",
      password_enc: "12345678@Abc",
      env: "test",
      sign_type: 2,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Error inserting config:", error);
  } else {
    console.log("Success:", data);
  }
}

main();
