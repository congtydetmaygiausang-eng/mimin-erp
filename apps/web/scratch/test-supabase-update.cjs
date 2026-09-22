const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const variantUpdates = { so_luong: 1 };
    const firstRowId = "TP100618gct"; // Xám
    
    console.log("Updating...");
    const { data, error } = await supabase.from("kho_thanh_pham").update(variantUpdates).eq("id", firstRowId).select();
    
    console.log("Result:", JSON.stringify(data, null, 2));
    if (error) console.error("Error:", error);
}
check();
