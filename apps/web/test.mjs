import fs from "fs";
const env = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => { 
  const [k, v] = line.split("="); 
  if(k && v) acc[k] = v.replace(/\"/g, "").trim(); 
  return acc; 
}, {}); 

fetch(env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/san_pham?select=*&limit=5&order=created_at.desc", { 
  headers: { 
    apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
    Authorization: "Bearer " + env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  } 
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
