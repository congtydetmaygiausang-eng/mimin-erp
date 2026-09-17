import sys
path = 'apps/web/src/lib/data/danh-muc-sp-store.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'await client.from("san_pham").insert(buildDBPayload(sp));',
    '''const payload = buildDBPayload(sp);
        const { error } = await client.from("san_pham").insert(payload);
        if (error) {
          console.warn("L?i thêm SP (Supabase):", error.message);
          if (error.code === 'PGRST204' || error.message.includes("column")) {
             delete (payload as any).hinh_anh;
             delete (payload as any).trang_thai;
             delete (payload as any).chat_lieu;
             delete (payload as any).ncc;
             delete (payload as any).da_ban;
             delete (payload as any).rating;
             delete (payload as any).luot_xem;
             await client.from("san_pham").insert(payload);
          }
        }'''
)

content = content.replace(
    'await client.from("san_pham").update(snakeData).eq("ma_sp", id);',
    '''const { error } = await client.from("san_pham").update(snakeData).eq("ma_sp", id);
           if (error) {
             console.warn("L?i c?p nh?t SP (Supabase):", error.message);
             if (error.code === 'PGRST204' || error.message.includes("column")) {
               delete snakeData.hinh_anh;
               delete snakeData.trang_thai;
               delete snakeData.chat_lieu;
               delete snakeData.ncc;
               delete snakeData.da_ban;
               delete snakeData.rating;
               delete snakeData.luot_xem;
               if (Object.keys(snakeData).length > 0) {
                 await client.from("san_pham").update(snakeData).eq("ma_sp", id);
               }
             }
           }'''
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
