import fs from "node:fs/promises";
import path from "node:path";
const pdf = require("pdf-parse");

export async function extractText(
	pdfPath: string,
	password?: string,
	cacheDir: string = ".cache",
): Promise<string> {
	const buffer = await fs.readFile(pdfPath);

	// Calculate hash for caching
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(buffer);
	const hash = hasher.digest("hex");

	const cachePath = path.join(cacheDir, `${hash}.txt`);

	try {
		await fs.mkdir(cacheDir, { recursive: true });
		// Check if cached version exists
		const cachedText = await fs.readFile(cachePath, "utf-8");
		console.log(`Using cached text for ${path.basename(pdfPath)}`);
		return cachedText;
	} catch (e) {
		// Cache miss or error reading cache, parse PDF
		console.log(`Extracting text from ${path.basename(pdfPath)}...`);
		const data = await pdf(buffer, { password });
		const text = data.text;

		// Write to cache
		await fs.writeFile(cachePath, text, "utf-8");
		return text;
	}
}
