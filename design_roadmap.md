## Purpose & scope
This document describes the design for a local-first Bun (TypeScript) CLI that imports manually provided statement PDFs, parses transactions offline, and writes them into an existing Google Sheets file (“balance sheet”) by creating a new tab per month (e.g., “Dec 25”) and appending rows.  
The system targets two sources: credit-card statements (mostly fixed merchants) and UPI/bank statements (free-form notes), producing a single normalized transaction schema and writing to the same spreadsheet ID every run.

## Architecture
**Runtime & packaging**
- Bun runs TypeScript directly, making it ideal for a local CLI with fast iteration.[1][2]
- Deliver as a single repo with `bun run src/cli.ts <command>` and optional `bun build` later.

**High-level components**
- `Extractor`: PDF → text (offline), plus caching extracted `.txt` to make parsing reproducible.
- `Parser`: text → `Transaction[]` using profile-based rules (per bank/card statement format).
- `Validator/Reconciler`: schema validation + totals checks + dedupe fingerprint generation.
- `SheetsClient`: OAuth token handling + Google Sheets API operations (get tabs, duplicate template tab, append rows).
- `LocalStore`: config + token storage (e.g., `~/.spend-importer/config.json`).

**Primary workflow (import)**
1. User selects PDF(s) and provides (or auto-detects) the target month label (e.g., `Dec 25`).
2. Extract text locally, parse into normalized transactions, validate, and dedupe.
3. Ensure month tab exists (prefer duplicating a `TEMPLATE` tab for formatting/formulas).
4. Append rows into the month tab.

## Data & parsing design
**Canonical transaction model**
- `date` (ISO `DD-MM-YYYY`)
- `amount` (number, normalized to positive + `direction`)
- `direction` (`debit | credit`)
- `merchant` (canonicalized)
- `description` (raw statement text)
- `source` (`credit_card | debit_upi`)
- `monthSheet` (e.g., `Dec 25`)
- `fingerprint` (sha1 of stable fields for idempotency)
- `importedAt` (timestamp)

**Parsing approach (deterministic first)**
- Profile-driven parsing: each statement type gets its own config (row-start regex, header/footer removal patterns, multiline description rules, amount/date parsing rules).
- Merchant normalization: simple mapping table for fixed merchants; fallback uses cleaned description.
- Confidence + reconciliation gates: fail import if required fields missing or if computed totals obviously disagree with statement totals (when available).

**Idempotency**
- Always compute `fingerprint` and prevent duplicates by reading existing fingerprints from the target month tab (or keeping a local cache keyed by `spreadsheetId + sheetName`).  
- Keep a separate `Imports` tab (optional) to log each run (file hash, month, rows appended, timestamp).

## Google Sheets integration
**Existing “balance sheet” file**
- Store `spreadsheetId` in local config; all writes go to that file.

**Tab discovery**
- Use `spreadsheets.get` to fetch sheet metadata (titles + sheetIds) so the tool can check whether “Dec 25” already exists.[3]

**Create month tab (recommended: duplicate TEMPLATE)**
- Use `spreadsheets.batchUpdate` with a `duplicateSheet` request to duplicate a `TEMPLATE` tab into the new month name, preserving formulas/formatting.[4][5]
- If you don’t want a template, `batchUpdate` can also add a blank sheet via `addSheet`.[6][4]

**Append transactions**
- Use `spreadsheets.values.append` to append transaction rows to a range like `"Dec 25!A:H"` with a required `valueInputOption`, and optionally `insertDataOption=INSERT_ROWS` for log-style inserts.[7]

## Roadmap (execution plan)
**Phase 0 — Setup (0.5 day)**
- Create Bun project + CLI scaffolding (`init`, `import`, `dry-run`, `list-sheets`).
- Define the canonical transaction schema + CSV/JSON output format.

**Phase 1 — Offline extraction (1–2 days)**
- Implement `extract(pdfPath) -> text` with caching (`.cache/<hash>.txt`).
- Add fixtures from a few real PDFs (redacted) + golden `.txt` outputs.

**Phase 2 — Parser v1 (3–6 days)**
- Build one parser profile end-to-end (pick the easiest statement).
- Implement multiline row handling + date/amount parsing + merchant normalization.
- Add validation, dedupe fingerprinting, and a `dry-run` report (rows + totals).

**Phase 3 — Google auth + read-only ops (1–2 days)**
- OAuth token flow (local) + store refresh token securely.
- Implement `list-sheets` via `spreadsheets.get` and verify the tool can see your “balance sheet” tabs.[3]

**Phase 4 — Monthly tab automation (2–4 days)**
- Add `TEMPLATE` tab convention.
- Implement “ensure month tab exists” by duplicating TEMPLATE with `spreadsheets.batchUpdate` + `duplicateSheet`.[5][4]
- Write headers only when creating a new month tab (if you choose non-template tabs).

**Phase 5 — Upload (1–3 days)**
- Append parsed transactions with `spreadsheets.values.append` into the month tab.[7]
- Add post-append verification (row count, optional checksum column).

**Phase 6 — Hardening (ongoing)**
- Add a second parser profile (credit card vs bank/UPI) and regression tests for both.
- Add `--strict` mode (abort on any parse ambiguity) and `--interactive` mode (prompt to fix merchant/category before upload).
- Optional: add a local LLM fallback *only* for rows that fail deterministic parsing, still validated against schema.
