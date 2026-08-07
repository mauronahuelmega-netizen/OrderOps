$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Oasis Desktop\Desktop\Full Stack Developer\Projects\OrderOps"

Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), "Process")
  }
}

$base = $env:NEXT_PUBLIC_SUPABASE_URL.TrimEnd("/")
$key = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$h = @{ apikey = $key; Authorization = "Bearer $key" }

$pilot = "e21b8fc2-3016-4dec-92ef-ebb04e58ecdf"
$fix = "59db34de-a48f-4fa8-b7fd-7ed5cc48d6c4"
$opt = "4f2ce494-c1ba-4c4e-8449-2e8e69df2497"
$asn = "9d68f30f-81b8-4495-98d9-024a1044d950"
$ugi = "6457581d-5be1-4c23-bf31-c981cfb8b082"
$ovr = "d08a0a85-4013-4e70-ba5c-c1d90fcac059"

$lines = New-Object System.Collections.Generic.List[string]
function Count-Rest([string]$label, [string]$path) {
  $r = Invoke-RestMethod -Uri "$base/rest/v1/$path" -Headers $h
  $lines.Add("$label=$(@($r).Count)") | Out-Null
}

Count-Rest "anon_fixture_business_settings" "business_settings?business_id=eq.$fix&select=business_id"
Count-Rest "anon_pilot_business_settings" "business_settings?business_id=eq.$pilot&select=business_id"
Count-Rest "anon_fixture_customization_groups" "customization_groups?business_id=eq.$fix&select=id"
Count-Rest "anon_fixture_upsell_groups" "upsell_groups?business_id=eq.$fix&select=id"
Count-Rest "anon_fixture_option_by_id" "customization_options?id=eq.$opt&select=id"
Count-Rest "anon_fixture_assignment_by_id" "customization_group_assignments?id=eq.$asn&select=id"
Count-Rest "anon_fixture_upsell_item_by_id" "upsell_group_items?id=eq.$ugi&select=id"
Count-Rest "anon_fixture_override_by_id" "product_customization_overrides?id=eq.$ovr&select=id"
Count-Rest "anon_pilot_customization_groups" "customization_groups?business_id=eq.$pilot&select=id"
Count-Rest "anon_pilot_customization_options" "customization_options?business_id=eq.$pilot&select=id"
Count-Rest "anon_pilot_upsell_groups" "upsell_groups?business_id=eq.$pilot&select=id"
Count-Rest "anon_pilot_upsell_group_items" "upsell_group_items?business_id=eq.$pilot&select=id"

$rpcH = @{
  apikey = $key
  Authorization = "Bearer $key"
  "Content-Type" = "application/json"
}
$fixBody = @{ p_business_id = $fix } | ConvertTo-Json -Compress
$pilotBody = @{ p_business_id = $pilot } | ConvertTo-Json -Compress
$fixRpc = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/is_public_product_customization_enabled" -Headers $rpcH -Body $fixBody
$pilotRpc = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/is_public_product_customization_enabled" -Headers $rpcH -Body $pilotBody
$lines.Add("anon_helper_fixture=$fixRpc") | Out-Null
$lines.Add("anon_helper_pilot=$pilotRpc") | Out-Null

$lines | Set-Content tmp/flag-off-fixture-anon.txt -Encoding utf8
$lines | ForEach-Object { Write-Output $_ }
