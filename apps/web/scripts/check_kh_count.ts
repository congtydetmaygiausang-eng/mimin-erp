import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabaseKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, count, error } = await supabase.from("khach_hang").select("*", { count: "exact", head: true });
  if (error) {
    console.error("Lỗi:", error.message);
  } else {
    console.log("Số lượng Khách Hàng trên Supabase:", count);
  }
}
check();
