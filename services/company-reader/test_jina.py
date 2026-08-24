import urllib.request
import urllib.error

url = "https://r.jina.ai/https://example.com"
headers = {
    "Accept": "application/json",
    "X-Return-Format": "markdown",
    "X-With-Generated-Alt": "false",
    "User-Agent": "MIMIN-CompanyReader/1.0 (+https://mimin-erp.vercel.app)",
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        print("Status:", response.status)
        print("Data length:", len(response.read()))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
except Exception as e:
    print("Error:", e)
