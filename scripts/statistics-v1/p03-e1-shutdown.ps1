$ErrorActionPreference = 'Stop'
$qaRecord = Get-Content -LiteralPath 'docs/estadisticas-v1/p03-e1/qa-server.json' -Raw | ConvertFrom-Json
if ($qaRecord.app -ne 'http://127.0.0.1:3037' -or $qaRecord.api -ne 'http://127.0.0.1:56321') { throw 'Unexpected QA identity' }
$qaParent = Get-CimInstance Win32_Process -Filter "ProcessId = $($qaRecord.pid)"
if (-not $qaParent -or $qaParent.Name -ne 'node.exe' -or $qaParent.CommandLine -notmatch '--port\s+3037') { throw 'Owned QA parent mismatch' }
$qaChildren = @(Get-CimInstance Win32_Process -Filter "ParentProcessId = $($qaRecord.pid)")
foreach ($qaChild in $qaChildren) {
 if ($qaChild.Name -ne 'node.exe' -or $qaChild.CommandLine -notmatch 'next.*start-server') { throw 'Unexpected child; no processes stopped' }
}
$otherBefore = @(Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
Stop-Process -Id $qaParent.ProcessId -Force
foreach ($qaChild in $qaChildren) { if (Get-Process -Id $qaChild.ProcessId -ErrorAction SilentlyContinue) { Stop-Process -Id $qaChild.ProcessId -Force } }
Start-Sleep -Seconds 1
$qaListeners = @(Get-NetTCPConnection -State Listen -LocalPort 3037 -ErrorAction SilentlyContinue)
if ($qaListeners.Count -gt 0) { throw 'QA listener remains; do not touch unknown processes' }
$otherAfter = @(Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
@{ at = [DateTime]::UtcNow.ToString('o'); ownedParent = $qaParent.ProcessId; ownedChildren = @($qaChildren.ProcessId); port3037Closed = $true; otherPort3001Before = $otherBefore; otherPort3001After = $otherAfter; containersTouched = $false } | ConvertTo-Json | Set-Content -LiteralPath 'docs/estadisticas-v1/p03-e1/qa-shutdown.json'
Write-Output 'PASS: only verified owned QA process tree stopped; port 3037 closed'
