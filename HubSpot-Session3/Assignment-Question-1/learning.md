# HubSpot CMS Theme Workflow

## What This Workflow Is For

This guide explains how to inspect files in a HubSpot Design Manager theme, save a local copy, make changes safely, compare the result with the original, and upload the finished file. The examples use placeholders so they can be adapted to another account, theme, or assignment.

## 1. Check the CLI and Sign In

The HubSpot CLI (`hs`) is a command-line tool for working with HubSpot developer projects and CMS files.

```powershell
hs --version
hs account list
hs account auth
```

- `hs --version` confirms that the CLI is installed and shows its version.
- `hs account list` shows the account aliases configured on this computer.
- `hs account auth` starts the sign-in flow for an account.

Use the account alias shown by `hs account list` in later commands. An alias identifies a configured account; it is not the account's password.

## 2. Find the Remote Files

Use `hs cms list` to inspect a theme folder in the selected account:

```powershell
hs cms list "<theme-folder>" --account=<account-alias>
```

For example, `<theme-folder>` might be a path such as `company/theme-templates`. Use a path that exists in your account, and check the listing for the exact remote file names before fetching or uploading.

## 3. Prepare Local Folders

Keep the downloaded original, any reference files, and your edits separate:

```powershell
New-Item -ItemType Directory -Force -Path .\original-backup, .\notes, .\working
```

- `original-backup` stores the original file for comparison or recovery.
- `notes` stores reference material, such as a downloaded module.
- `working` contains the copy you intend to edit and upload.

## 4. Fetch a Template and Its Dependencies

Fetch the original template to the backup folder:

```powershell
hs cms fetch "<theme-folder>/<template-file>" ".\original-backup" --account=<account-alias>
```

List a module folder to discover available modules:

```powershell
hs cms list "<theme-folder>/<module-folder>" --account=<account-alias>
```

Fetch a module to the notes folder when you need to inspect how it works:

```powershell
hs cms fetch "<theme-folder>/<module-folder>/<module-name>.module" ".\notes\<module-name>" --account=<account-alias>
```

Fetching a module for reference does not mean you need to edit or upload it. Check the template's references and the module's fields before deciding whether it is a dependency of your work.

## 5. Edit a Working Copy

Copy the backed-up template into `working` and make changes there. Keep `original-backup` unchanged so you can compare your result with the source.

Templates can contain HubL, HTML, and references to other theme files. Before changing paths, check where the template is stored and how its existing references are written. A relative path is resolved from the template's location.

## 6. Review Changes Before Upload

Compare the original and edited files:

```powershell
git --no-pager diff --no-index `
  ".\original-backup\<template-file>" `
  ".\working\<edited-template-file>"
```

This displays the differences between two files even if they are not in a Git repository. An exit code of `1` means differences were found; inspect the diff rather than treating that result by itself as a command failure. Review the output for unintended removals, broken references, or leftover sample content.

## 7. Upload and Verify

Upload the edited file to the intended remote location:

```powershell
hs cms upload ".\working\<edited-template-file>" "<theme-folder>/<destination-file>" --account=<account-alias>
```

Uploads change the remote CMS file, so confirm the account and destination before running the command. Then list the destination folder to verify that the file is present:

```powershell
hs cms list "<theme-folder>/<destination-folder>" --account=<account-alias>
```

A successful upload or file listing confirms that the file was transferred; it does not by itself prove that the template compiles or behaves correctly. Where possible, check the template in HubSpot, create an unpublished test page, and preview desktop and mobile layouts.

## Command Reference

| Command | Purpose |
| --- | --- |
| `hs --version` | Check the installed CLI version. |
| `hs account list` | See configured HubSpot account aliases. |
| `hs account auth` | Authenticate with a HubSpot account. |
| `hs cms list` | Inspect remote CMS folders and file names. |
| `hs cms fetch` | Download a remote CMS file to a local folder. |
| `hs cms upload` | Upload a local file to a remote CMS path. |
| `git diff --no-index` | Compare two files without requiring a Git repository. |

## Key Takeaways

- Confirm the account alias and exact remote paths before downloading or uploading.
- Preserve the original and edit a separate working copy.
- Inspect dependencies and relative paths when adapting a template.
- Use a diff to review changes before uploading.
- Verify the file in HubSpot as well as confirming that it was uploaded.
