# Core Parsing & Extraction

The parsing pipeline consists of three phases: Text Extraction (with Caching), Profile Matching, and Transaction Parsing.

## 1. Extraction & Caching (`src/core/extractor.ts`)

The `extractText(pdfPath, password, cacheDir)` function relies on `pdf-parse`. 
To improve performance during repeated testing (e.g., `dry-run`), it uses Bun's `CryptoHasher` (`sha256`) to hash the raw PDF buffer. The extracted text is saved to `.cache/<hash>.txt`. Next time the same PDF is provided, the text is loaded instantly from the cache.

## 2. Parser Engine (`src/core/parser.ts`)

The `parseStatement(text, profiles)` function receives the raw text and an array of `ParserProfile` objects. 
It tests the `identityPattern` (a Regex) of each profile against the text. The first profile that tests positive is selected, and its `parse` process is executed.

## 3. Profiles & Extensibility (`src/core/profiles/`)

Profiles define how specific statement formats are mapped to domain models (`Transaction`).

### Interface
```typescript
export interface ParserProfile {
	name: string;
	sourceType: "credit_card" | "debit_upi";
	identityPattern: RegExp;
	parse: (text: string) => Promise<Transaction[]>;
}
```

### Example: `HDFCCreditProfile`
- **Identifier**: `/HDFC BANK.*CREDIT CARD/i`
- **Parser**: Uses a massive Regex `/(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([\d,]+\.\d{2})\s+(Cr|Dr)/g` to iteratively capture:
  1. Date (`DD/MM/YYYY`)
  2. Merchant/Description
  3. Amount (comma-separated format)
  4. Direction (`Cr` or `Dr`)

### Fingerprinting
To ensure idempotency (preventing duplicate uploads to Google Sheets), a unique `fingerprint` is generated for each transaction. Currently, this relies on a `sha256` hash of `${date}|${description}|${amount}|${direction}`.

## Schema (`src/types/schema.ts`)

Parsed data is checked against Zod schemas. The standardized fields for a `Transaction` are:
- `date`: ISO string or original string format
- `amount`: Number (parsed from decimal/comma strings)
- `direction`: `"debit"` or `"credit"`
- `merchant` & `description`: Text components of the transaction.
- `source`: `"credit_card"` or `"debit_upi"`
- `fingerprint`: Unique ID hash.
- `importedAt`: Timestamp of processing.
