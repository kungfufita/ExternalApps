<#
.SYNOPSIS
    Saves every attachment from an Outlook folder, gives each a unique name,
    then compares consecutive versions of each backup and writes the delta to CSV.

.DESCRIPTION
    Walks the Outlook folder "Colour 2\robot backups" (configurable), saves each
    attachment as  <received timestamp>_<original name>  so identically named
    backups from different emails do not collide, writes a manifest CSV, and then
    diffs each backup against the previous one (ordered by received time).

    Text files are compared line by line. Zip files are compared entry by entry
    (and text entries inside the zip are diffed line by line). Other binary files
    are reported as changed/unchanged by SHA-256 hash.

.PARAMETER OutputFolder
    Where to save attachments and CSVs. If omitted, a folder picker opens.

.PARAMETER FolderPath
    Outlook folder path, backslash separated. Default: "Colour 2\robot backups".

.PARAMETER StoreName
    Optional mailbox/store display name to search in (e.g. "troy@example.com").
    If omitted, every store in the Outlook profile is searched.

.PARAMETER Overwrite
    Re-download attachments that have already been saved.

.PARAMETER NoCompare
    Only save attachments; skip the comparison step.

.EXAMPLE
    .\Save-RobotBackups.ps1 -OutputFolder "D:\RobotBackups"

.EXAMPLE
    .\Save-RobotBackups.ps1            # prompts for an output folder
#>
[CmdletBinding()]
param(
    [string]$OutputFolder,
    [string]$FolderPath = 'Colour 2\robot backups',
    [string]$StoreName,
    [switch]$Overwrite,
    [switch]$NoCompare
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# 1. Output folder
# ---------------------------------------------------------------------------
if (-not $OutputFolder) {
    Add-Type -AssemblyName System.Windows.Forms
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = 'Choose where to save the robot backups'
    $dlg.ShowNewFolderButton = $true
    if ($dlg.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host 'No folder chosen. Exiting.'
        return
    }
    $OutputFolder = $dlg.SelectedPath
}
$OutputFolder = (New-Item -ItemType Directory -Path $OutputFolder -Force).FullName
Write-Host "Saving to: $OutputFolder"

$manifestPath = Join-Path $OutputFolder 'manifest.csv'
$deltaPath    = Join-Path $OutputFolder 'delta.csv'
$summaryPath  = Join-Path $OutputFolder 'summary.csv'

# ---------------------------------------------------------------------------
# 2. Connect to Outlook and locate the folder
# ---------------------------------------------------------------------------
function Find-OutlookFolder {
    param($Root, [string[]]$Segments)
    # Depth-first search for the first segment, then walk the rest.
    $first = $Segments[0]
    $rest  = @()
    if ($Segments.Count -gt 1) { $rest = @($Segments[1..($Segments.Count - 1)]) }
    foreach ($f in @($Root.Folders)) {
        $candidate = $null
        if ($f.Name -ieq $first) {
            $candidate = $f
            foreach ($seg in $rest) {
                $next = $null
                foreach ($sub in @($candidate.Folders)) {
                    if ($sub.Name -ieq $seg) { $next = $sub; break }
                }
                if (-not $next) { $candidate = $null; break }
                $candidate = $next
            }
            if ($candidate) { return $candidate }
        }
        $deeper = Find-OutlookFolder -Root $f -Segments $Segments
        if ($deeper) { return $deeper }
    }
    return $null
}

Write-Host 'Connecting to Outlook...'
try {
    $outlook = New-Object -ComObject Outlook.Application
} catch {
    throw 'Could not start Outlook. Make sure Outlook (desktop) is installed and you can open it.'
}
$ns = $outlook.GetNamespace('MAPI')

$segments = @($FolderPath -split '[\\/]' | Where-Object { $_ -ne '' })
$target = $null
foreach ($store in @($ns.Folders)) {
    if ($StoreName -and $store.Name -ine $StoreName) { continue }
    $target = Find-OutlookFolder -Root $store -Segments $segments
    if ($target) { Write-Host "Found folder '$($target.FolderPath)'"; break }
}
if (-not $target) {
    throw "Outlook folder '$FolderPath' not found. Check the name, or pass -StoreName."
}

# ---------------------------------------------------------------------------
# 3. Save attachments with unique names
# ---------------------------------------------------------------------------
function Sanitize-FileName([string]$name) {
    $invalid = [IO.Path]::GetInvalidFileNameChars() -join ''
    return ($name -replace "[$([regex]::Escape($invalid))]", '_')
}

function Get-Sha256([string]$path) {
    return (Get-FileHash -Path $path -Algorithm SHA256).Hash
}

# Previous run, keyed by mail EntryID + attachment name, so re-runs skip what is already saved.
$previous = @{}
if (Test-Path $manifestPath) {
    foreach ($row in @(Import-Csv $manifestPath)) {
        $previous["$($row.EntryID)|$($row.AttachmentName)"] = $row
    }
}

$items = $target.Items
$items.Sort('[ReceivedTime]', $false)   # oldest first
$total = $items.Count
Write-Host "Found $total items in the folder."

$manifest = New-Object System.Collections.Generic.List[object]
$saved = 0; $skipped = 0
$i = 0
foreach ($mail in @($items)) {
    $i++
    if ($mail.Class -ne 43) { continue }          # 43 = olMail
    if ($mail.Attachments.Count -eq 0) { continue }

    $received = [datetime]$mail.ReceivedTime
    $stamp = $received.ToString('yyyyMMdd_HHmmss')
    Write-Progress -Activity 'Saving attachments' -Status "$i / $total  $($mail.Subject)" -PercentComplete (100 * $i / $total)

    foreach ($att in @($mail.Attachments)) {
        # Skip embedded OLE objects that are not real files
        if ($att.Type -eq 6) { continue }            # 6 = olOLE
        $orig = $att.FileName
        if (-not $orig) { continue }

        $key = "$($mail.EntryID)|$orig"
        $existing = $null
        if ($previous.ContainsKey($key)) { $existing = $previous[$key] }

        if ($existing -and -not $Overwrite -and (Test-Path (Join-Path $OutputFolder $existing.SavedFile))) {
            $manifest.Add($existing)
            $skipped++
            continue
        }

        $safe = Sanitize-FileName $orig
        if ($existing) {
            $dest = Join-Path $OutputFolder $existing.SavedFile
        } else {
            $dest = Join-Path $OutputFolder ($stamp + '_' + $safe)
            $n = 1
            while (Test-Path $dest) {
                # Another email with the same received second and attachment name.
                $n++
                $dest = Join-Path $OutputFolder ("{0}_{1}_{2}" -f $stamp, $n, $safe)
            }
        }

        $att.SaveAsFile($dest)
        $saved++

        $manifest.Add([pscustomobject]@{
            SavedFile      = [IO.Path]::GetFileName($dest)
            AttachmentName = $orig
            Received       = $received.ToString('yyyy-MM-dd HH:mm:ss')
            Subject        = $mail.Subject
            Sender         = $mail.SenderName
            SizeBytes      = (Get-Item $dest).Length
            Sha256         = Get-Sha256 $dest
            EntryID        = $mail.EntryID
        })
    }
}
Write-Progress -Activity 'Saving attachments' -Completed

# Keep rows from earlier runs whose emails are no longer in Outlook but whose files still exist,
# so the comparison covers every backup on disk.
$known = @{}
foreach ($m in $manifest) { $known[$m.SavedFile] = $true }
foreach ($o in $previous.Values) {
    if (-not $known.ContainsKey($o.SavedFile) -and (Test-Path (Join-Path $OutputFolder $o.SavedFile))) {
        $manifest.Add($o)
        $known[$o.SavedFile] = $true
    }
}
$manifest = @($manifest | Sort-Object AttachmentName, Received, SavedFile)
$manifest | Export-Csv -Path $manifestPath -NoTypeInformation -Encoding UTF8
Write-Host "Saved $saved new attachments, skipped $skipped already saved. $($manifest.Count) total. Manifest: $manifestPath"

if ($NoCompare) { return }

# ---------------------------------------------------------------------------
# 4. Compare consecutive versions of each backup
# ---------------------------------------------------------------------------
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Test-IsTextBytes([byte[]]$bytes) {
    $len = [Math]::Min($bytes.Length, 8000)
    for ($k = 0; $k -lt $len; $k++) { if ($bytes[$k] -eq 0) { return $false } }
    return $true
}

function Get-TextLines([byte[]]$bytes) {
    # Honour a BOM if present, otherwise assume UTF-8 (falls back fine for ASCII/Latin-1 robot files).
    $enc = [Text.Encoding]::UTF8
    if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) { $enc = [Text.Encoding]::Unicode }
    elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) { $enc = [Text.Encoding]::BigEndianUnicode }
    $text = $enc.GetString($bytes)
    return ($text -split "`r?`n")
}

# Line-level LCS diff. Returns objects with Change (Added/Removed), OldLine, NewLine, Text.
function Compare-Lines([string[]]$a, [string[]]$b) {
    $n = $a.Count; $m = $b.Count
    $result = New-Object System.Collections.Generic.List[object]

    # Trim common prefix / suffix first so the DP table only covers the changed middle.
    $start = 0
    while ($start -lt $n -and $start -lt $m -and $a[$start] -ceq $b[$start]) { $start++ }
    $endA = $n - 1; $endB = $m - 1
    while ($endA -ge $start -and $endB -ge $start -and $a[$endA] -ceq $b[$endB]) { $endA--; $endB-- }

    $la = $endA - $start + 1
    $lb = $endB - $start + 1
    if ($la -le 0 -and $lb -le 0) { return $result }

    # Guard against huge middles: fall back to a set-based diff.
    if ([long]$la * [long]$lb -gt 10000000) {
        $setB = @{}; foreach ($s in $b[$start..$endB]) { $setB[$s] = $true }
        $setA = @{}; foreach ($s in $a[$start..$endA]) { $setA[$s] = $true }
        for ($k = $start; $k -le $endA; $k++) {
            if (-not $setB.ContainsKey($a[$k])) { $result.Add([pscustomobject]@{ Change='Removed'; OldLine=$k+1; NewLine=''; Text=$a[$k] }) }
        }
        for ($k = $start; $k -le $endB; $k++) {
            if (-not $setA.ContainsKey($b[$k])) { $result.Add([pscustomobject]@{ Change='Added'; OldLine=''; NewLine=$k+1; Text=$b[$k] }) }
        }
        return $result
    }

    $dp = [int[,]]::new($la + 1, $lb + 1)
    for ($x = $la - 1; $x -ge 0; $x--) {
        for ($y = $lb - 1; $y -ge 0; $y--) {
            if ($a[$start + $x] -ceq $b[$start + $y]) { $dp[$x, $y] = $dp[($x + 1), ($y + 1)] + 1 }
            elseif ($dp[($x + 1), $y] -ge $dp[$x, ($y + 1)]) { $dp[$x, $y] = $dp[($x + 1), $y] }
            else { $dp[$x, $y] = $dp[$x, ($y + 1)] }
        }
    }
    $x = 0; $y = 0
    while ($x -lt $la -and $y -lt $lb) {
        if ($a[$start + $x] -ceq $b[$start + $y]) { $x++; $y++ }
        elseif ($dp[($x + 1), $y] -ge $dp[$x, ($y + 1)]) {
            $result.Add([pscustomobject]@{ Change='Removed'; OldLine=$start+$x+1; NewLine=''; Text=$a[$start+$x] }); $x++
        } else {
            $result.Add([pscustomobject]@{ Change='Added'; OldLine=''; NewLine=$start+$y+1; Text=$b[$start+$y] }); $y++
        }
    }
    while ($x -lt $la) { $result.Add([pscustomobject]@{ Change='Removed'; OldLine=$start+$x+1; NewLine=''; Text=$a[$start+$x] }); $x++ }
    while ($y -lt $lb) { $result.Add([pscustomobject]@{ Change='Added'; OldLine=''; NewLine=$start+$y+1; Text=$b[$start+$y] }); $y++ }
    return $result
}

function Get-ZipEntries([string]$path) {
    $map = @{}
    $zip = [IO.Compression.ZipFile]::OpenRead($path)
    try {
        foreach ($e in $zip.Entries) {
            if ($e.FullName.EndsWith('/')) { continue }
            $ms = New-Object IO.MemoryStream
            $s = $e.Open(); $s.CopyTo($ms); $s.Dispose()
            $map[$e.FullName] = $ms.ToArray()
        }
    } finally { $zip.Dispose() }
    return $map
}

function New-DeltaRow($pair, $entry, $change, $oldLine, $newLine, $text) {
    [pscustomobject]@{
        AttachmentName = $pair.Name
        FromFile       = $pair.From.SavedFile
        FromReceived   = $pair.From.Received
        ToFile         = $pair.To.SavedFile
        ToReceived     = $pair.To.Received
        Entry          = $entry
        Change         = $change
        OldLine        = $oldLine
        NewLine        = $newLine
        Text           = $text
    }
}

# Compare two byte arrays (text or binary). Emits rows; returns count of changed lines.
function Compare-Content($pair, [string]$entry, [byte[]]$oldBytes, [byte[]]$newBytes, $delta) {
    if ($null -eq $oldBytes) {
        $delta.Add((New-DeltaRow $pair $entry 'EntryAdded' '' '' "$($newBytes.Length) bytes")); return 1
    }
    if ($null -eq $newBytes) {
        $delta.Add((New-DeltaRow $pair $entry 'EntryRemoved' '' '' "$($oldBytes.Length) bytes")); return 1
    }
    $sha = [Security.Cryptography.SHA256]::Create()
    $h1 = [BitConverter]::ToString($sha.ComputeHash($oldBytes))
    $h2 = [BitConverter]::ToString($sha.ComputeHash($newBytes))
    if ($h1 -eq $h2) { return 0 }

    if ((Test-IsTextBytes $oldBytes) -and (Test-IsTextBytes $newBytes)) {
        $rows = Compare-Lines (Get-TextLines $oldBytes) (Get-TextLines $newBytes)
        foreach ($r in $rows) { $delta.Add((New-DeltaRow $pair $entry $r.Change $r.OldLine $r.NewLine $r.Text)) }
        return $rows.Count
    }
    $delta.Add((New-DeltaRow $pair $entry 'BinaryChanged' '' '' "$($oldBytes.Length) -> $($newBytes.Length) bytes"))
    return 1
}

$delta   = New-Object System.Collections.Generic.List[object]
$summary = New-Object System.Collections.Generic.List[object]

$groups = $manifest | Group-Object AttachmentName
foreach ($g in $groups) {
    $versions = @($g.Group | Sort-Object Received, SavedFile)
    if ($versions.Count -lt 2) {
        $summary.Add([pscustomobject]@{ AttachmentName=$g.Name; FromFile=''; ToFile=$versions[0].SavedFile; Result='OnlyOneVersion'; Changes=0 })
        continue
    }
    for ($v = 1; $v -lt $versions.Count; $v++) {
        $pair = [pscustomobject]@{ Name = $g.Name; From = $versions[$v-1]; To = $versions[$v] }
        $fromPath = Join-Path $OutputFolder $pair.From.SavedFile
        $toPath   = Join-Path $OutputFolder $pair.To.SavedFile
        Write-Host ("Comparing {0}  ->  {1}" -f $pair.From.SavedFile, $pair.To.SavedFile)

        if ($pair.From.Sha256 -eq $pair.To.Sha256) {
            $summary.Add([pscustomobject]@{ AttachmentName=$g.Name; FromFile=$pair.From.SavedFile; ToFile=$pair.To.SavedFile; Result='Identical'; Changes=0 })
            continue
        }

        $changes = 0
        $ext = [IO.Path]::GetExtension($toPath).ToLowerInvariant()
        $isZip = $false
        if ($ext -eq '.zip') {
            try {
                $oldEntries = Get-ZipEntries $fromPath
                $newEntries = Get-ZipEntries $toPath
                $isZip = $true
            } catch { $isZip = $false }
        }

        if ($isZip) {
            $names = @($oldEntries.Keys) + @($newEntries.Keys) | Sort-Object -Unique
            foreach ($name in $names) {
                $o = $null; $nw = $null
                if ($oldEntries.ContainsKey($name)) { $o = $oldEntries[$name] }
                if ($newEntries.ContainsKey($name)) { $nw = $newEntries[$name] }
                $changes += Compare-Content $pair $name $o $nw $delta
            }
            $result = 'ZipChanged'
        } else {
            $oldBytes = [IO.File]::ReadAllBytes($fromPath)
            $newBytes = [IO.File]::ReadAllBytes($toPath)
            $changes += Compare-Content $pair '' $oldBytes $newBytes $delta
            if ((Test-IsTextBytes $oldBytes) -and (Test-IsTextBytes $newBytes)) { $result = 'TextChanged' } else { $result = 'BinaryChanged' }
        }
        $summary.Add([pscustomobject]@{ AttachmentName=$g.Name; FromFile=$pair.From.SavedFile; ToFile=$pair.To.SavedFile; Result=$result; Changes=$changes })
    }
}

$delta   | Export-Csv -Path $deltaPath   -NoTypeInformation -Encoding UTF8
$summary | Export-Csv -Path $summaryPath -NoTypeInformation -Encoding UTF8

Write-Host ''
Write-Host "Done."
Write-Host "  Attachments : $OutputFolder"
Write-Host "  Manifest    : $manifestPath"
Write-Host "  Summary     : $summaryPath   ($($summary.Count) comparisons)"
Write-Host "  Delta       : $deltaPath     ($($delta.Count) changed lines/entries)"
