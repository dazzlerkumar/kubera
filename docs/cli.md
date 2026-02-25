# Command Line Interface (CLI)

Kubera provides a CLI built with `commander`. The CLI is defined in `src/cli.ts`.

## Commands

### `init`
Initializes the local configuration and sets up the Google Sheets connection.
*Status: Stubbed / To Be Implemented*
```bash
bun run src/cli.ts init
```

### `import <file>`
Imports transactions from a PDF statement into Google Sheets.
*Status: Stubbed / To Be Implemented*
```bash
bun run src/cli.ts import path/to/statement.pdf --month "Dec 25" --password "secret"
```
**Options:**
- `-m, --month <month>`: Target month label for the Google Sheet tab.
- `-p, --password <password>`: Password for encrypted PDFs.

### `dry-run <file>`
Parses the statement and prints the extracted transactions to the console without uploading to Google Sheets. Calculates and displays the calculated Net Amount.
*Status: Fully Implemented*
```bash
bun run src/cli.ts dry-run path/to/statement.pdf --password "secret"
```
**Options:**
- `-p, --password <password>`: Password for encrypted PDFs.

**Example Output:**
```text
Dry-running path/to/statement.pdf with password: none
Using cached text for statement.pdf
Matched profile: HDFC Credit Card

--- Parsed Transactions ---
┌─────────┬──────────────┬────────────────────────────┬────────┬───────────┐
│ (index) │     Date     │          Merchant          │ Amount │ Direction │
├─────────┼──────────────┼────────────────────────────┼────────┼───────────┤
│    0    │ '20/12/2023' │ 'AMAZON SELLER SERVICES'   │  2500  │  'debit'  │
└─────────┴──────────────┴────────────────────────────┴────────┴───────────┘

Total Transactions: 1
Net Amount: -2500.00
```

### `list-sheets`
Lists the tabs available in the configured Google Sheets file.
*Status: Stubbed / To Be Implemented*
```bash
bun run src/cli.ts list-sheets
```
