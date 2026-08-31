import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webPush from "npm:web-push"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const VAPID_PUBLIC_KEY = "BLxrje5fHlOUOWYTQTlsEZbQvr1unmu86pJu522Xr0lyUrhECLFe4KXuz7PszOphkF8ODQ9iklk58SyrJYWHnKg";
// VAPID_PRIVATE_KEY should be set in Supabase Secrets
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

if (VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:admin@mimin.vn",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Database Webhook Payload
    const payload = await req.json()
    const { type, record } = payload

    if (type !== 'NEW_TASK' || !record) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    // record is the new row in phan_cong table
    // It has fields like id, tenCongDoan, nguoiMa, nguoiTen, vv.
    const nhanVienId = record.nguoiMa || record.nguoiTen;

    if (!nhanVienId) {
      return new Response(JSON.stringify({ message: "No user assigned" }), { status: 200 })
    }

    // Create Supabase Client to query push_subscriptions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the subscriptions for this user
    const { data: subs, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_name', nhanVienId)

    if (error || !subs || subs.length === 0) {
      console.log("No subscriptions found for user", nhanVienId);
      return new Response(JSON.stringify({ message: "No subscriptions found" }), { status: 200 })
    }

    const notificationPayload = JSON.stringify({
      title: "MIMIN ERP: Có việc mới!",
      body: `Bạn vừa được giao phụ trách ${record.tenCongDoan} cho số lượng: ${record.soLuong} cái.`,
      icon: "/logo.png",
      url: "/to-ht-work"
    });

    let successCount = 0;
    
    // Send push to all registered devices of this user
    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth_key,
          p256dh: sub.p256dh_key
        }
      };

      try {
        await webPush.sendNotification(pushSubscription, notificationPayload);
        successCount++;
      } catch (err) {
        console.error("Failed to send push notification to endpoint", sub.endpoint, err);
        // Optional: Delete invalid subscription
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${successCount} notifications` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
