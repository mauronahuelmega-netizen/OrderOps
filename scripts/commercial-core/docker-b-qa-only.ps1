# Fase B de Docker. No borra contenedores ni volumenes y no ejecuta SQL.
# Uso, despues de abrir Docker Desktop a mano:
#   powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage Inventory
#   powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage Pause -Confirm Pause
#   powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage StartQa -Confirm StartQa
#   powershell -NoProfile -File scripts/commercial-core/docker-b-qa-only.ps1 -Stage Restore -Confirm Restore -InventoryPath <primer-inventario.json>
# Conservar el inventario anterior a Pause. Un inventario posterior ya no tiene la politica original.

[CmdletBinding()]
param(
  [ValidateSet("Inventory", "Pause", "StartQa", "Restore")]
  [string]$Stage = "Inventory",
  [string]$Confirm = "",
  [string]$InventoryPath = ""
)

$ErrorActionPreference = "Stop"
$QaProject = "orderops-phase06-qa"
$QaWorkdir = "C:\Users\Oasis Desktop\Desktop\Full Stack Developer\legacy-backups\OrderOps\phase06-qa-stack"
$QaConfig = Join-Path $QaWorkdir "supabase\config.toml"
$QaApiPort = 56721
$QaDbPort = 56722
$PauseProjects = @(
  "OrderOps",
  "orderops-statistics-v1-test-74718de66a41",
  "orderops-ledger-rebuild",
  "majo-pasteleria-caja",
  "orderops-phase05-accept",
  "orderops-phase05-audit"
)
$ServicePrefixes = @(
  "edge_runtime", "pg_meta", "imgproxy", "realtime", "analytics", "inbucket",
  "storage", "studio", "vector", "pooler", "auth", "rest", "kong", "db"
)

function Wait-DockerEngine {
  $deadline = (Get-Date).AddMinutes(3)
  do {
    & docker info --format "{{.ServerVersion}}" 1>$null 2>$null
    if ($LASTEXITCODE -eq 0) {
      return
    }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)
  throw "Docker no responde. Este script no abre Docker Desktop."
}

function Read-QaConfig {
  if (-not (Test-Path -LiteralPath $QaConfig)) {
    throw "No existe el config canonico del QA."
  }
  $project = $null
  $api = $null
  $db = $null
  $section = ""
  foreach ($line in [System.IO.File]::ReadLines($QaConfig)) {
    if ($line -match '^\s*\[(.+)\]\s*$') {
      $section = $Matches[1]
      continue
    }
    if ($section -eq "" -and $line -match '^\s*project_id\s*=\s*"([^"]+)"\s*$') {
      $project = $Matches[1]
    }
    if ($section -eq "api" -and $null -eq $api -and $line -match '^\s*port\s*=\s*(\d+)\s*$') {
      $api = [int]$Matches[1]
    }
    if ($section -eq "db" -and $null -eq $db -and $line -match '^\s*port\s*=\s*(\d+)\s*$') {
      $db = [int]$Matches[1]
    }
  }
  if ($project -ne $QaProject -or $api -ne $QaApiPort -or $db -ne $QaDbPort) {
    throw "La identidad del config canonico no es orderops-phase06-qa en 56721/56722."
  }
  return [pscustomobject]@{ Project = $project; ApiPort = $api; DbPort = $db; Workdir = $QaWorkdir }
}

function Get-ProjectFromName {
  param([string]$Name)
  $bare = $Name.TrimStart("/")
  foreach ($service in $ServicePrefixes) {
    $prefix = "supabase_${service}_"
    if ($bare.StartsWith($prefix)) {
      return $bare.Substring($prefix.Length)
    }
  }
  return $null
}

function Get-HostPorts {
  param($Bindings)
  $ports = @()
  if ($null -eq $Bindings) {
    return $ports
  }
  foreach ($property in $Bindings.PSObject.Properties) {
    foreach ($binding in @($property.Value)) {
      if ($binding.HostPort) {
        $ports += [int]$binding.HostPort
      }
    }
  }
  return $ports
}

function Get-VolumeNames {
  param($Mounts)
  $names = @()
  foreach ($mount in @($Mounts)) {
    if ($mount.Type -eq "volume" -and $mount.Name) {
      $names += [string]$mount.Name
    }
  }
  return $names
}

function Get-Inventory {
  $ids = @( & docker ps -aq )
  if ($LASTEXITCODE -ne 0) {
    throw "docker ps fallo."
  }
  $rows = @()
  foreach ($id in $ids) {
    if ([string]::IsNullOrWhiteSpace($id)) {
      continue
    }
    $raw = & docker inspect --format "{{json .}}" $id
    if ($LASTEXITCODE -ne 0) {
      throw "docker inspect fallo para un contenedor."
    }
    $item = $raw | ConvertFrom-Json
    $labelProject = [string]$item.Config.Labels."com.supabase.cli.project"
    $composeProject = [string]$item.Config.Labels."com.docker.compose.project"
    $nameProject = Get-ProjectFromName -Name ([string]$item.Name)
    $project = $null
    $source = "unknown"
    if ($labelProject) {
      $project = $labelProject
      $source = "label"
      if ($nameProject -and $nameProject -ne $labelProject) {
        $source = "label-name-mismatch"
      }
    }
    elseif ($composeProject -and -not $nameProject) {
      $project = $composeProject
      $source = "compose-label"
    }
    elseif ($nameProject) {
      $project = $nameProject
      $source = "name"
    }
    $class = "unknown"
    if ($source -eq "label-name-mismatch") {
      $class = "mismatch"
    }
    elseif ($project -eq $QaProject) {
      $class = "qa"
    }
    elseif ($PauseProjects -contains $project) {
      $class = "pause"
    }
    $rows += [pscustomobject]@{
      Id = [string]$item.Id.Substring(0, 12)
      Name = ([string]$item.Name).TrimStart("/")
      State = [string]$item.State.Status
      RestartPolicy = [string]$item.HostConfig.RestartPolicy.Name
      Project = $project
      ProjectSource = $source
      Class = $class
      HostPorts = @(Get-HostPorts -Bindings $item.HostConfig.PortBindings)
      Volumes = @(Get-VolumeNames -Mounts $item.Mounts)
    }
  }
  return $rows
}

function Test-Safety {
  param($Rows)
  $blocked = @()
  foreach ($row in $Rows) {
    $supabaseName = $row.Name -like "supabase_*"
    $qaVolume = @($row.Volumes) -contains "supabase_db_$QaProject" -or @($row.Volumes) -contains "supabase_storage_$QaProject"
    if ($row.Class -eq "qa" -and $qaVolume -eq $false -and $row.Name -eq "supabase_db_$QaProject") {
      $blocked += "$($row.Name) no monta su volumen de datos"
    }
    if ($row.Class -ne "qa" -and $qaVolume) {
      $blocked += "$($row.Name) monta un volumen del QA"
    }
    if ($row.Class -eq "mismatch") {
      $blocked += "$($row.Name) tiene etiqueta y nombre de proyectos distintos"
    }
    $unknownRisk = $row.Class -eq "unknown" -and (
      $row.State -eq "running" -or
      $supabaseName -or
      ($row.RestartPolicy -and $row.RestartPolicy -ne "no")
    )
    if ($unknownRisk) {
      $blocked += "$($row.Name) queda sin clasificar y puede afectar el procedimiento"
    }
    $reserved = @(54320, 54321, 54322, 54323, 54324, 54327, 54329, 54330, 54331, 54332, 54333, 54334, 54337, 54339, 56321, 56322, 56421, 56422, 56423, 56424, 56427, 56429, 56520, 56521, 56522, 56523, 56524, 56527, 56529, 56620, 56621, 56622, 56623, 56624, 56627, 56629, 56720, 56721, 56722, 56723, 56724, 56727, 56729, 56932)
    if ($row.Class -eq "unknown") {
      foreach ($port in @($row.HostPorts)) {
        if ($reserved -contains $port) {
          $blocked += "$($row.Name) publica el puerto $port"
        }
      }
    }
  }
  return $blocked
}

function Write-InventoryFile {
  param($Rows, $Config)
  $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  $dir = Join-Path $repoRoot "tmp\docker-b"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $path = Join-Path $dir ("inventory-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
  $payload = [pscustomobject]@{
    CapturedAt = (Get-Date).ToString("o")
    Stage = $Stage
    QaConfig = $Config
    Containers = $Rows
  }
  $payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $path -Encoding utf8
  return $path
}

Wait-DockerEngine
$config = Read-QaConfig

if ($Stage -eq "Restore") {
  if ($Confirm -ne "Restore") {
    throw "Restore exige -Confirm Restore."
  }
  if (-not (Test-Path -LiteralPath $InventoryPath)) {
    throw "Restore exige el inventario tomado antes de Pause."
  }
  $saved = Get-Content -LiteralPath $InventoryPath -Raw | ConvertFrom-Json
  $rows = Get-Inventory
  $blocked = @(Test-Safety -Rows $rows | Where-Object { $_ -notlike "*queda sin clasificar*" })
  if ($blocked.Count -gt 0) {
    $blocked | ForEach-Object { Write-Output $_ }
    throw "Restore detenido por un conflicto de identidad."
  }
  foreach ($savedRow in @($saved.Containers)) {
    if ($savedRow.Class -ne "pause") {
      continue
    }
    $policy = [string]$savedRow.RestartPolicy
    if (@("no", "always", "on-failure", "unless-stopped") -notcontains $policy) {
      throw "Politica original no reconocida para $($savedRow.Name)."
    }
    $live = @($rows | Where-Object { $_.Name -eq $savedRow.Name })
    if ($live.Count -ne 1 -or $live[0].Class -ne "pause") {
      throw "El contenedor $($savedRow.Name) ya no clasifica como pausa."
    }
    & docker update "--restart=$policy" $savedRow.Name | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "No se pudo restaurar la politica de $($savedRow.Name)."
    }
    if ($live[0].State -ne "running") {
      & docker start $savedRow.Name | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "No se pudo iniciar $($savedRow.Name)."
      }
    }
  }
  Write-Output "restore-complete"
  return
}

$rows = @(Get-Inventory)
$blocked = @(Test-Safety -Rows $rows)
$path = Write-InventoryFile -Rows $rows -Config $config
Write-Output "inventory=$path"
Write-Output ("qa=" + (@($rows | Where-Object { $_.Class -eq "qa" }).Count))
Write-Output ("pause=" + (@($rows | Where-Object { $_.Class -eq "pause" }).Count))
Write-Output ("unknown=" + (@($rows | Where-Object { $_.Class -eq "unknown" }).Count))
Write-Output ("mismatch=" + (@($rows | Where-Object { $_.Class -eq "mismatch" }).Count))

if ($Stage -eq "Inventory") {
  if ($blocked.Count -gt 0) {
    $blocked | ForEach-Object { Write-Output "review: $_" }
    exit 10
  }
  return
}

if ($blocked.Count -gt 0) {
  $blocked | ForEach-Object { Write-Output "review: $_" }
  throw "Hay contenedores sin una asociacion segura. No se cambio ninguna politica."
}

if ($Stage -eq "Pause") {
  if ($Confirm -ne "Pause") {
    throw "Pause exige -Confirm Pause."
  }
  foreach ($row in @($rows | Where-Object { $_.Class -eq "pause" })) {
    & docker update --restart=no $row.Name | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "No se pudo cambiar la politica de $($row.Name)."
    }
    if ($row.State -eq "running") {
      & docker stop $row.Name | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "No se pudo detener $($row.Name)."
      }
    }
  }
  $after = @(Get-Inventory)
  $still = @($after | Where-Object { $_.Class -eq "pause" -and $_.State -eq "running" })
  if ($still.Count -gt 0) {
    throw "Quedaron contenedores de pausa en ejecucion."
  }
  Write-Output "pause-complete"
  return
}

if ($Stage -eq "StartQa") {
  if ($Confirm -ne "StartQa") {
    throw "StartQa exige -Confirm StartQa."
  }
  $runningPause = @($rows | Where-Object { $_.Class -eq "pause" -and $_.State -eq "running" })
  if ($runningPause.Count -gt 0) {
    throw "Hay stacks de pausa en ejecucion. StartQa no los detiene."
  }
  $qaDb = @($rows | Where-Object { $_.Name -eq "supabase_db_$QaProject" })
  if ($qaDb.Count -ne 1 -or $qaDb[0].Class -ne "qa") {
    throw "No existe supabase_db_orderops-phase06-qa con la etiqueta del QA. No se crea el stack."
  }
  foreach ($row in @($rows | Where-Object { $_.Class -eq "qa" -and $_.State -ne "running" })) {
    & docker start $row.Name | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "No se pudo iniciar $($row.Name)."
    }
  }
  $after = @(Get-Inventory)
  $apiOwner = @($after | Where-Object { $_.State -eq "running" -and @($_.HostPorts) -contains $QaApiPort })
  $dbOwner = @($after | Where-Object { $_.State -eq "running" -and @($_.HostPorts) -contains $QaDbPort })
  if ($apiOwner.Count -ne 1 -or $apiOwner[0].Class -ne "qa" -or $dbOwner.Count -ne 1 -or $dbOwner[0].Class -ne "qa") {
    throw "56721 o 56722 no pertenecen solo al QA."
  }
  $runningPause = @($after | Where-Object { $_.Class -eq "pause" -and $_.State -eq "running" })
  if ($runningPause.Count -gt 0) {
    throw "Un stack pausado volvio a ejecutarse."
  }
  Write-Output "qa-started api=56721 db=56722"
  return
}
