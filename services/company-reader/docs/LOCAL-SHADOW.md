# Chạy Company Reader shadow trên máy cá nhân

Local shadow chỉ nghe tại `127.0.0.1:8765`, không có CORS, không ghi Supabase và
không thay đổi luồng tìm công ty hiện tại của MIMIN ERP.

## Python trực tiếp — dùng ngay khi chưa có Docker

Chế độ này dùng guardrail bộ nhớ, chỉ phù hợp một tiến trình thử nghiệm:

```powershell
$env:COMPANY_READER_ENABLED = 'true'
$env:COMPANY_READER_SERVICE_TOKEN = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(36))
$env:COMPANY_READER_ALLOW_MEMORY_GUARDRAILS = 'true'
$env:COMPANY_READER_DEPLOYMENT = 'dark-launch'
$env:COMPANY_READER_GUARDRAIL_MODE = 'memory'
$env:COMPANY_READER_ALLOWED_CLIENTS = 'mimin-local-smoke'
$env:COMPANY_READER_ROLLOUT_MODE = 'shadow'
$env:COMPANY_READER_CANARY_PERCENT = '0'
$env:JINA_API_KEY = ''

python -m pip install -r services/company-reader/requirements.txt
Set-Location services/company-reader
python -m uvicorn company_reader.app:app --host 127.0.0.1 --port 8765 --workers 1 --no-access-log
```

Giữ token trong đúng cửa sổ PowerShell, không lưu vào Git hoặc biến
`NEXT_PUBLIC_*`.

## Docker Compose — Company Reader + Valkey

Yêu cầu Docker Desktop đang chạy:

```powershell
$env:COMPANY_READER_SERVICE_TOKEN = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(36))
$env:JINA_API_KEY = ''
docker compose -f services/company-reader/compose.local.yaml up --build -d
docker compose -f services/company-reader/compose.local.yaml ps
```

Valkey không publish port ra máy chủ. Company Reader chỉ publish vào loopback.
Không thêm Jina key miễn phí vào local nếu điều khoản sử dụng không phù hợp.

## Kiểm tra

```powershell
Invoke-RestMethod http://127.0.0.1:8765/healthz
Invoke-RestMethod http://127.0.0.1:8765/readyz

$headers = @{
  Authorization = "Bearer $env:COMPANY_READER_SERVICE_TOKEN"
  'X-Mimin-Client' = 'mimin-local-smoke'
}
$body = @{
  request_id = 'local_shadow_20260820_001'
  urls = @('https://example.com/')
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Uri http://127.0.0.1:8765/v1/company-reader/read `
  -Method Post `
  -Headers $headers `
  -ContentType application/json `
  -Body $body
```

Kết quả shadow hợp lệ trả HTTP `202`, chỉ có số lượng nguồn/hồ sơ và không trả dữ
liệu công ty ra caller.

## Gửi URL bằng shadow caller local

Caller chỉ chấp nhận endpoint loopback để tránh vô tình gửi service token ra
Internet:

```powershell
python -m company_reader.shadow_probe `
  --request-id local_shadow_manual_001 `
  https://example.com/
```

Có thể truyền tối đa năm URL trong một lần. Ở chế độ shadow, output chỉ gồm trạng
thái và số lượng; hồ sơ chuẩn hóa không được đưa vào MIMIN ERP.

## Chạy quality gate cục bộ

Mỗi batch bị giới hạn tối đa 10 lượt để tránh gây tải lớn lên website nguồn:

```powershell
python -m company_reader.shadow_batch `
  --runs 3 `
  "https://masothue.com/0318507560-cong-ty-tnhh-det-may-giau-sang"
```

Báo cáo chỉ có số lượt thành công/thất bại, tổng nguồn/hồ sơ/cảnh báo và p50/p95.
Không chuyển sang canary chỉ dựa trên một batch; cần tối thiểu 200 lượt shadow
trong ít nhất 7 ngày như runbook triển khai quy định.

## Dừng Docker

```powershell
docker compose -f services/company-reader/compose.local.yaml down
```
