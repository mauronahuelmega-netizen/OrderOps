$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Oasis Desktop\Desktop\Full Stack Developer\Projects\OrderOps"

Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable(
      $matches[1].Trim(),
      $matches[2].Trim().Trim('"'),
      "Process"
    )
  }
}

$base = $env:NEXT_PUBLIC_SUPABASE_URL.TrimEnd("/")
$key = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$bid = "e21b8fc2-3016-4dec-92ef-ebb04e58ecdf"
$h = @{
  apikey = $key
  Authorization = "Bearer $key"
}

$lines = @()

$bs = Invoke-RestMethod -Uri "$base/rest/v1/business_settings?business_id=eq.$bid&select=business_id" -Headers $h
$lines += "business_settings_count=$($bs.Count)"

$cg = Invoke-RestMethod -Uri "$base/rest/v1/customization_groups?business_id=eq.$bid&select=id&is_available=eq.true" -Headers $h
$lines += "customization_groups_count=$($cg.Count)"

$co = Invoke-RestMethod -Uri "$base/rest/v1/customization_options?business_id=eq.$bid&select=id&is_available=eq.true" -Headers $h
$lines += "customization_options_count=$($co.Count)"

$cga = Invoke-RestMethod -Uri "$base/rest/v1/customization_group_assignments?business_id=eq.$bid&select=id&is_enabled=eq.true" -Headers $h
$lines += "customization_group_assignments_count=$($cga.Count)"

$ug = Invoke-RestMethod -Uri "$base/rest/v1/upsell_groups?business_id=eq.$bid&select=id,name&is_available=eq.true" -Headers $h
$lines += "upsell_groups_count=$($ug.Count)"
$lines += "upsell_group_names=$($ug.name -join ',')"

$ugi = Invoke-RestMethod -Uri "$base/rest/v1/upsell_group_items?business_id=eq.$bid&select=id&is_available=eq.true" -Headers $h
$lines += "upsell_group_items_count=$($ugi.Count)"

$rpcBody = '{"p_business_id":"' + $bid + '"}'
$rpc = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/is_public_product_customization_enabled" -Headers @{
  apikey = $key
  Authorization = "Bearer $key"
  "Content-Type" = "application/json"
} -Body $rpcBody
$lines += "helper_enabled=$rpc"

$lines | Set-Content -Path "tmp/anon-rls-hardening-check.txt" -Encoding utf8
$lines | ForEach-Object { Write-Output $_ }
