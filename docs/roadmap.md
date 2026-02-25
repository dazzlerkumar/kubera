# Roadmap & Future Features

This document outlines the planned future features and development goals for Kubera.

## High Priority

### 1. Google Sheets Integration (`init`, `import`, `list-sheets`)
Currently, these commands are stubbed in the CLI. The implementation needs to integrate the `googleapis` package to interact directly with the user's targeted Google Sheet.
- **`init`**: Set up OAuth or Service Account credentials for Google Sheets.
- **`list-sheets`**: Retrieve and list available tabs/sheets in the configured spreadsheet.
- **`import`**: Execute the parsing pipeline and perform batch uploads/inserts to Google Sheets, using the `monthSheet` parameter to route transactions to the correct tab. Ensure idempotency using the generated `fingerprint` (e.g., checking if the hash already exists before appending).

### 2. More Parser Profiles (Bank Support)
Kubera currently supports parsing statements from **HDFC Credit Cards**. To make it more universally useful, support for other common Indian banks and statement types will be added:
- **SBI** (Credit / Debit / UPI)
- **ICICI Bank** (Credit / Debit / UPI)
- **Axis Bank** (Credit / Debit)
- **Standard HDFC Savings/Debit**

### 3. Automatic Password Management
Implement a secure, local configuration system to optionally store and pass statement passwords automatically (e.g., using macOS Keychain or an encrypted local config) instead of providing them plainly via the CLI argument `-p`.

## Medium Priority

### 4. Interactive Configuration Wizard
Improve the `init` command to offer an interactive shell prompt for gathering credentials, target spreadsheet IDs, and default options.

### 5. Automated Category Tagging
Introduce a lightweight local rule engine to automatically assign categories (e.g., "Food", "Travel", "Utilities") to transactions based on merchant names or descriptions before uploading them to Google Sheets.

### 6. Enhanced Validation and Error Handling
Improve the extraction engine to better handle corrupted or non-standard PDFs, and refine the Zod schema to include more robust validations.

## Low Priority (Ideas)

- **Web Dashboard (Local)**: A lightweight local web GUI built on Bun's native HTTP server to view cached transactions, dry-runs, and manage Google Sheet tokens without using the CLI.
- **Transaction Deduplication UI**: A visual diff before syncing to Google Sheets to review exactly what will be uploaded and what will be skipped.
