import fs from 'fs';

async function run() {
  const csvText = fs.readFileSync('C:/Users/POLOMIN/.gemini/antigravity-ide/brain/541afa99-b350-46d4-b7b2-f65125f0fae2/scratch/data.csv', 'utf-8');
  const lines = csvText.trim().split('\n');
  
  const records = lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      ma_kh: cols[0]?.trim() || '',
      ten_kh: cols[1]?.trim() || '',
      loai: cols[2]?.trim() || '',
      sdt: cols[3]?.trim() || '',
      facebook_url: cols[4]?.trim() || '',
      email: cols[5]?.trim() || '',
      dia_chi: cols[6]?.trim() || '',
      mst: cols[7]?.trim() || '',
      cong_no: parseInt(cols[8]) || 0,
      han_muc_no: parseInt(cols[9]) || 0,
      rating: parseInt(cols[10]) || 4,
      ghi_chu: '',
      trang_thai: 'Thường'
    };
  }).filter(r => r.ma_kh && r.ten_kh);

  let sql = 'INSERT INTO public.khach_hang (id, ma_kh, ten_kh, loai, sdt, facebook_url, email, dia_chi, mst, cong_no, han_muc_no, rating, ghi_chu, trang_thai)\nVALUES\n';
  
  const values = records.map(r => {
    const escape = (str: string) => "'" + str.replace(/'/g, "''") + "'";
    return `(gen_random_uuid(), ${escape(r.ma_kh)}, ${escape(r.ten_kh)}, ${escape(r.loai)}, ${escape(r.sdt)}, ${escape(r.facebook_url)}, ${escape(r.email)}, ${escape(r.dia_chi)}, ${escape(r.mst)}, ${r.cong_no}, ${r.han_muc_no}, ${r.rating}, ${escape(r.ghi_chu)}, ${escape(r.trang_thai)})`;
  });

  sql += values.join(',\n') + '\nON CONFLICT (ma_kh) DO UPDATE SET\n' +
    'ten_kh = EXCLUDED.ten_kh,\n' +
    'loai = EXCLUDED.loai,\n' +
    'sdt = EXCLUDED.sdt,\n' +
    'facebook_url = EXCLUDED.facebook_url,\n' +
    'dia_chi = EXCLUDED.dia_chi,\n' +
    'cong_no = EXCLUDED.cong_no,\n' +
    'han_muc_no = EXCLUDED.han_muc_no,\n' +
    'rating = EXCLUDED.rating;\n';

  // Also add the GRANT just in case
  sql = 'GRANT ALL ON public.khach_hang TO service_role, anon, authenticated;\n\n' + sql;

  fs.writeFileSync('C:/Users/POLOMIN/.gemini/antigravity-ide/brain/541afa99-b350-46d4-b7b2-f65125f0fae2/scratch/insert_customers.sql', sql);
  console.log('SQL generated successfully.');
}

run();
