import urllib.request
import time
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

supabase_url = "https://ejcuqyaiwabfygyesvxj.supabase.co"
supabase_key = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd"

print("=== SUPABASE REAL HEALTH CHECK ===")
print("URL:", supabase_url)

t0 = time.time()
try:
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/",
        headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
    )
    with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
        print(f"REST root: Status {res.status}, Time: {time.time()-t0:.3f}s")
except Exception as e:
    print(f"REST root Error: {e} ({time.time()-t0:.3f}s)")

for tbl in ["lenh_cat", "don_hang", "khach_hang", "nhan_su", "users"]:
    t0 = time.time()
    try:
        req = urllib.request.Request(
            f"{supabase_url}/rest/v1/{tbl}?select=id&limit=1",
            headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
        )
        with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
            data = res.read().decode("utf-8")
            print(f"Table '{tbl}': Status {res.status}, Time: {time.time()-t0:.3f}s, Response: {data[:50]}")
    except Exception as e:
        print(f"Table '{tbl}' Error: {e} ({time.time()-t0:.3f}s)")
