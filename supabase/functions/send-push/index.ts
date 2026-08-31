import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push@3.6.4"

console.log("Push Notification function started!")

// Use the VAPID keys securely stored in Supabase secrets
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BLxrje5fHlOUOWYTQTlsEZbQvr1unmu86pJu522Xr0lyUrhECLFe4KXuz7PszOphkF8ODQ9iklk58SyrJYWHnKg'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

// Vapid setup (Subject should be a mailto or URL)
if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@mimin.vn',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

serve(async (req) => {
  try {
    if (!VAPID_PRIVATE_KEY) {
      throw new Error('VAPID_PRIVATE_KEY is missing from environment variables')
    }

    const payload = await req.json()
    console.log("Received webhook payload:", payload)

    // Ensure it's a new task
    if (payload.type === 'NEW_TASK' && payload.record) {
      const task = payload.record

      // Initialize Supabase admin client to fetch subscriptions
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

      // Get user_name to notify (assuming 'nguoiPhuTrach' contains name or ID)
      // Extract the name part before ' (' if it's formatted like 'Name (GC)'
      const targetNameRaw = task.nguoiPhuTrach?.ten || task.nguoiPhuTrach || ""
      const targetName = targetNameRaw.split(' (')[0].trim()

      console.log(`Looking for subscription for user: ${targetName}`)

      // Lấy danh sách đăng ký thiết bị của user này từ database
      // LƯU Ý: Vì có thể gõ sai tên, chúng ta có thể cần fuzzy search hoặc search wildcard
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .ilike('user_name', `%${targetName}%`)

      if (error) {
        console.error("Error fetching subscriptions:", error)
        throw error
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscription found for user: ${targetName}`)
        return new Response(JSON.stringify({ status: 'ignored', reason: 'no_subscription' }), { headers: { "Content-Type": "application/json" } })
      }

      const pushMessage = JSON.stringify({
        title: "Việc Mới (Hoàn Thiện)",
        body: `Bạn được giao công đoạn ${task.congDoan} cho Lệnh: ${task.lenhCatId}`,
        url: "/to-ht-work"
      })

      // Send push notification to all devices registered by this user
      const pushPromises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth_key,
              p256dh: sub.p256dh_key
            }
          }
          await webpush.sendNotification(pushSubscription, pushMessage)
          console.log(`Successfully sent push to endpoint: ${sub.endpoint.slice(0, 30)}...`)
        } catch (err: any) {
          console.error(`Failed to send push to ${sub.endpoint}:`, err)
          // If the subscription is no longer valid (e.g. 410 Gone), delete it from DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Deleting invalid subscription: ${sub.endpoint}`)
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      })

      await Promise.all(pushPromises)
      
      return new Response(JSON.stringify({ status: 'success', notified: subscriptions.length }), { headers: { "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({ status: 'ignored', reason: 'not_a_task' }), { headers: { "Content-Type": "application/json" } })

  } catch (err: any) {
    console.error("Error in edge function:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
