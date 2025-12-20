import { Command } from "commander";
import packageJson from "../package.json";

const program = new Command();

program
	.name("kubera")
	.description("Local-first bank statement importer for Google Sheets")
	.version(packageJson.version);

program
	.command("init")
	.description("Initialize local configuration and Google Sheets connection")
	.action(() => {
		console.log("Initializing Kubera...");
		// TODO: Implement init logic
	});

program
	.command("import")
	.description("Import transactions from a PDF statement")
	.argument("<file>", "Path to the PDF statement")
	.option("-m, --month <month>", "Target month label (e.g., Dec 25)")
	.option("-p, --password <password>", "Password for encrypted PDFs")
	.action((file, options) => {
		console.log(
			`Importing ${file} for ${options.month || "auto-detected month"}...`,
		);
		// TODO: Implement import logic
	});

program
	.command("dry-run")
	.description("Parse statement and show results without uploading")
	.argument("<file>", "Path to the PDF statement")
	.option("-p, --password <password>", "Password for encrypted PDFs")
	.action((file, options) => {
		console.log(
			`Dry-running ${file} with password: ${options.password ? "****" : "none"}`,
		);
		// TODO: Implement dry-run logic
	});

program
	.command("list-sheets")
	.description("List tabs in the target Google Sheets file")
	.action(() => {
		console.log("Listing sheets...");
		// TODO: Implement list-sheets logic
	});

program.parse();
