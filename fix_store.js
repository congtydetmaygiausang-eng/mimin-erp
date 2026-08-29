const fs = require('fs');
let data = fs.readFileSync('apps/web/src/lib/data/danh-muc-sp-store.tsx', 'utf8');

data = data.replace(
  'await client.from("san_pham").insert(buildDBPayload(sp));',
  'const payload = buildDBPayload(sp);\n        const { error } = await client.from("san_pham").insert(payload);\n        if (error) {\n          console.warn("L?i thêm SP Supabase:", error.message);\n          if (error.code === \\'PGRST204\\' || error.message.includes("column")) {\n             delete payload.hinh_anh;\n             delete payload.trang_thai;\n             delete payload.chat_lieu;\n             delete payload.ncc;\n             delete payload.da_ban;\n             delete payload.rating;\n             delete payload.luot_xem;\n             await client.from("san_pham").insert(payload);\n          }\n        }'
);

data = data.replace(
  'await client.from("san_pham").update(snakeData).eq("ma_sp", id);',
  'const { error } = await client.from("san_pham").update(snakeData).eq("ma_sp", id);\n           if (error) {\n             console.warn("L?i c?p nh?t SP Supabase:", error.message);\n             if (error.code === \\'PGRST204\\' || error.message.includes("column")) {\n               delete snakeData.hinh_anh;\n               delete snakeData.trang_thai;\n               delete snakeData.chat_lieu;\n               delete snakeData.ncc;\n               delete snakeData.da_ban;\n               delete snakeData.rating;\n               delete snakeData.luot_xem;\n               if (Object.keys(snakeData).length > 0) {\n                 await client.from("san_pham").update(snakeData).eq("ma_sp", id);\n               }\n             }\n           }'
);

fs.writeFileSync('apps/web/src/lib/data/danh-muc-sp-store.tsx', data);
