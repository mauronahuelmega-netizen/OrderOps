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
$off1 = "9be9757f-60af-4a90-9621-837c98d19e29"  # roticeriajuan
$off2 = "a9b41e85-33ce-4094-8ee1-4953bd2b6ebd"  # majopasteleria

$lines = @()

function Count-Rest($label, $path) {
  $r = Invoke-RestMethod -Uri "$base/rest/v1/$path" -Headers $h
  $c = @($r).Count
  $script:lines += "$label=$c"
}

Count-Rest "pilot_business_settings" "business_settings?business_id=eq.$pilot&select=business_id"
Count-Rest "off1_business_settings" "business_settings?business_id=eq.$off1&select=business_id"
Count-Rest "off2_business_settings" "business_settings?business_id=eq.$off2&select=business_id"

Count-Rest "pilot_customization_groups" "customization_groups?business_id=eq.$pilot&select=id"
Count-Rest "off1_customization_groups" "customization_groups?business_id=eq.$off1&select=id"
Count-Rest "off2_customization_groups" "customization_groups?business_id=eq.$off2&select=id"

Count-Rest "pilot_upsell_groups" "upsell_groups?business_id=eq.$pilot&select=id"
Count-Rest "off1_upsell_groups" "upsell_groups?business_id=eq.$off1&select=id"
Count-Rest "off2_upsell_groups" "upsell_groups?business_id=eq.$off2&select=id"

Count-Rest "pilot_upsell_group_items" "upsell_group_items?business_id=eq.$pilot&select=id"
Count-Rest "off1_upsell_group_items" "upsell_group_items?business_id=eq.$off1&select=id"
Count-Rest "off2_upsell_group_items" "upsell_group_items?business_id=eq.$off2&select=id"

Count-Rest "pilot_customization_options" "customization_options?business_id=eq.$pilot&select=id"
Count-Rest "off1_customization_options" "customization_options?business_id=eq.$off1&select=id"

$rpcH = @{ apikey = $key; Authorization = "Bearer $key"; "Content-Type" = "application/json" }
$pilotRpc = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/is_public_product_customization_enabled" -Headers $rpcH -Body ("{`"p_business_id`":`"$pilot`"}")
$off1Rpc = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/is_public_product_customization_enabled" -Headers $rpcH -Body ("{`"p_business_id`":`"$off1`"}")
$off2Rpc = Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/is_public_product_customization_enabled" -Headers $rpcH -Body ("{`"p_business_id`":`"$off2`"}")
$lines += "helper_pilot=$pilotRpc"
$lines += "helper_off1_roticeriajuan=$off1Rpc"
$lines += "helper_off2_majopasteleria=$off2Rpc"

$lines | Set-Content -Path "tmp/flag-off-anon-check.txt" -Encoding utf8
$lines | ForEach-Object { Write-Output $_ }
