# Outlook robot backup exporter and differ

`Save-RobotBackups.ps1` pulls every attachment out of the Outlook folder
**Colour 2 \ robot backups**, saves them to a folder you choose, and then
compares each backup with the previous one and writes the differences to CSV.

## Requirements

- Windows with desktop Outlook installed and the mailbox configured.
- Windows PowerShell 5.1 or PowerShell 7. No extra modules.

## Run it

Open PowerShell and run one of:

```powershell
# Prompts with a folder picker for the destination
.\Save-RobotBackups.ps1
```

```powershell
# Or give the destination directly
.\Save-RobotBackups.ps1 -OutputFolder "D:\RobotBackups"
```

If scripts are blocked, run once per window:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Options:

| Parameter | Purpose |
|---|---|
| `-FolderPath` | Outlook folder, default `Colour 2\robot backups`. The script searches every mailbox and any depth for it. |
| `-StoreName` | Limit the search to one mailbox, e.g. `-StoreName "name@company.com"`. |
| `-Overwrite` | Re-download attachments that already exist in the output folder. |
| `-NoCompare` | Save only, skip the diff. |

Re-running is incremental. Already saved files are skipped and the comparison
covers everything in the folder, old and new.

## What you get

Attachments are saved as `yyyyMMdd_HHmmss_<original name>` using the email's
received time, so backups with identical names never overwrite each other.

| File | Contents |
|---|---|
| `manifest.csv` | One row per saved attachment: saved name, original name, received time, subject, sender, size, SHA-256. |
| `summary.csv` | One row per consecutive pair of the same backup: Identical, TextChanged, ZipChanged, BinaryChanged, or OnlyOneVersion, with a change count. |
| `delta.csv` | The actual differences. One row per added or removed line, with the line number in the old and new file. |

Comparison rules:

- Backups with the same original attachment name are treated as versions of the
  same thing and compared oldest to newest, each against the one before it.
- Text files are diffed line by line (`Added` / `Removed` with line numbers).
- Zip files are opened and compared entry by entry. Text entries are diffed
  line by line; the `Entry` column names the file inside the zip.
- Other binary files are reported as `BinaryChanged` with old and new sizes.
