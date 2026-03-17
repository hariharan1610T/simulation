# OS Simulator Setup Guide

## 1) Prerequisites
- XAMPP installed (Apache enabled)
- PHP 8+ (included with XAMPP)
- Modern browser (Chrome/Edge/Firefox)

## 2) Installation Steps
1. Download or clone the project.
2. Place the project folder inside:
   - `C:\xampp\htdocs\` (Windows), or
   - `/opt/lampp/htdocs/` (Linux)
3. Start **Apache** from the XAMPP Control Panel.
4. Open:
   - `http://localhost/simulation`

## 3) Running in XAMPP
1. Open the frontend UI.
2. Choose a module:
   - CPU Scheduling
   - Banker's Algorithm
   - Page Replacement
   - Disk Scheduling
   - File Allocation
3. Enter inputs and click the run button.
4. The frontend sends JSON requests to `/api/*.php` and displays returned results.

## 4) Common Errors and Fixes

### Error: `404 /api/...`
- Ensure Apache is running.
- Ensure project path is inside `htdocs`.
- Confirm endpoint file exists in `api/` with `.php` extension.

### Error: `Only POST method is allowed`
- Endpoint expects `POST` with JSON body.
- Ensure frontend fetch uses:
  - `method: "POST"`
  - `headers: { "Content-Type": "application/json" }`

### Error: `Invalid JSON body`
- Check for malformed JSON payload.
- Verify `JSON.stringify(data)` is used in fetch body.

### Error: Validation message from API
- Review input constraints in UI (non-negative values, valid algorithm names, etc.).
- Correct input and run simulation again.

## 5) Screenshots (Placeholders)
- `screenshots/dashboard.png`
- `screenshots/cpu-scheduling.png`
- `screenshots/bankers.png`
- `screenshots/page-replacement.png`
- `screenshots/disk-scheduling.png`
- `screenshots/file-allocation.png`
