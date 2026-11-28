const fs = require('fs');
const path = require('path');
const { createClient } = require(path.resolve('apps/web/node_modules/@supabase/supabase-js'));

const content = fs.readFileSync('.env.production', 'utf8');
const serviceKey = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)?.[1]?.trim()?.replace(/^["']|["']$/g, '');
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const adminClient = createClient(url, serviceKey);

async function listFiles() {
  const { data: buckets } = await adminClient.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name));

  const { data: files, error } = await adminClient.storage.from('san-pham-media').list('kho-vai-moi', { limit: 100 });
  console.log('Files in kho-vai-moi:', files?.map(f => f.name));

  const { data: rootFiles } = await adminClient.storage.from('san-pham-media').list('', { limit: 100 });
  console.log('Folders/Files in san-pham-media root:', rootFiles?.map(f => f.name));
}
listFiles();
