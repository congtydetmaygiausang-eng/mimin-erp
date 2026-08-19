  const headers = lines[0].split(',');
  
  const records = lines.slice(1).map(line => {
    // Basic CSV split by comma (ignoring quotes for simplicity since this data doesn't seem to have embedded commas)
    const cols = line.split(',');
    return {
      id: crypto.randomUUID(),
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

  console.log(`Parsed ${records.length} records. Uploading to Supabase...`);
  
  // Upsert in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('khach_hang')
      .upsert(batch, { onConflict: 'ma_kh' });
      
    if (error) {
      console.error(`Error uploading batch ${i / BATCH_SIZE + 1}:`, error);
    } else {
      console.log(`Successfully uploaded batch ${i / BATCH_SIZE + 1}`);
    }
  }
  
  console.log("Done!");
}

run();
