# Kubera

Kubera is a local-first bank statement importer designed to parse PDF bank statements and export transactions directly to Google Sheets. It focuses on privacy (local parsing) and extensibility (via parser profiles).

## Architecture Overview

The system is built on **Bun** and **TypeScript**, utilizing a profile-based architecture to support multiple bank statement formats.

### Core Technologies
- **Bun**: Runtime and package manager for fast execution and built-in cryptography.
- **Commander**: CLI framework.
- **Zod**: Runtime validation and type safety for transactions.
- **pdf-parse**: Extracts raw text from PDF statements.
- **googleapis**: (Planned) Used for pushing extracted transactions to Google Sheets.

### Key Components

1. **CLI Layer (`src/cli.ts`)**: Defines commands (`init`, `import`, `dry-run`, `list-sheets`) to interact with the system.
2. **Extractor (`src/core/extractor.ts`)**: Reads PDF files, hashes them using `sha256` for caching, and extracts raw text using `pdf-parse`. Cached texts are saved in `.cache/` to speed up subsequent runs.
3. **Parser (`src/core/parser.ts`)**: Routes extracted text to the correct profile based on an `identityPattern` (Regex).
4. **Profiles (`src/core/profiles/*`)**: Individual parser configurations for specific banks/statements (e.g., `HDFCCreditProfile`). They define how to extract transactions using Regex.
5. **Schema (`src/types/schema.ts`)**: Zod schemas that enforce a consistent `Transaction` structure before they are stored or exported.

## Project Structure

```text
kubera/
├── .cache/                 # Cached text layers from parsed PDFs
├── package.json            # Dependencies and scripts (Bun)
├── src/
│   ├── cli.ts              # Command-line interface definitions
│   ├── types/
│   │   └── schema.ts       # Domain models (Transaction schema)
│   ├── core/
│   │   ├── extractor.ts    # PDF text extraction and caching logic
│   │   ├── parser.ts       # Profile matching and routing
│   │   └── profiles/
│   │       └── hdfc-credit.ts  # Parser for HDFC Credit Card statements
└── docs/                   # Project documentation
```
