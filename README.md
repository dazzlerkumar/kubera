# 🏦 Kubera

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Kubera** is a local-first, privacy-focused bank statement importer for Google Sheets. It automates the extraction of transactions from PDF statements and synchronizes them with your financial spreadsheets without ever sending your sensitive data to a third-party server.

---

## ✨ Features

- 🔒 **Privacy First**: All PDF parsing and data extraction happen locally on your machine.
- 📄 **PDF Extraction**: Intelligent text extraction from bank statements (including password-protected PDFs).
- 📊 **Google Sheets Sync**: Seamless integration to push transactions directly to your target spreadsheets.
- ⚡ **Lightning Fast**: Built on [Bun](https://bun.sh) for peak performance.
- 🧠 **Smart Caching**: Local caching of extracted text to speed up repeated runs.
- 🧠 **Smart Categorization**: Uses a local SLM (via Ollama) to intelligently categorize transactions without cloud APIs!
- 🛠️ **Developer Friendly**: Clean CLI interface with dry-run capabilities for safe testing.

---

## 🛠️ Tech Stack

Kubera is built using a modern, high-performance stack:

- **Runtime**: [Bun](https://bun.sh) (JavaScript/TypeScript runtime)
- **Local AI Context**: [Ollama](https://ollama.com) (For semantic categorization)
- **CLI Framework**: [Commander.js](https://github.com/tj/commander.js)
- **PDF Engine**: `pdf-parse`
- **Validation**: [Zod](https://zod.dev)
- **APIs**: Google Sheets API (via `googleapis`)
- **Linting & Formatting**: [Biome](https://biomejs.dev)
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed on your machine.
- [Ollama](https://ollama.com) installed and running locally for automatic categorization.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/kubera.git
   cd kubera
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Setup your Local LLM:
   Kubera uses Ollama to run a local SLM (e.g. `llama3.2`) for transaction categorization. 
   Before running the CLI, ensure Ollama is installed, running, and the model is pulled:
   ```bash
   ollama pull llama3.2
   ```

---

## 📖 Usage

Kubera provides a simple CLI to manage your bank statement imports.

### Initialization

Set up your local configuration and authenticate with Google Sheets:
```bash
bun run src/cli.ts init
```

### Dry Run (Test Parsing)

Verify the extraction results without uploading any data:
```bash
bun run src/cli.ts dry-run <path-to-pdf> [-p <password>]
```

### Import Transactions

Extract and upload transactions to Google Sheets:
```bash
bun run src/cli.ts import <path-to-pdf> [-m <month-label>] [-p <password>]
```

### List Sheets

List the available tabs in your target Google Sheet:
```bash
bun run src/cli.ts list-sheets
```

---

## 🏦 Supported Profiles

Currently, Kubera supports the following bank statement formats:

- ✅ **HDFC Bank** (Credit Cards)
- 🚧 *More profiles coming soon!*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
