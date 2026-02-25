import fs from "node:fs/promises";
import path from "node:path";
import { CategorySchema, type Transaction } from "../types/schema";

const CONTEXT_FILE = path.join(process.cwd(), "categories-context.json");

// Default dictionary starting point focusing on user's mentioned items
const DEFAULT_CONTEXT: Record<string, string> = {
	milk: "grocery",
	subji: "grocery",
	dahi: "grocery",
	breakfast: "grocery",
	chai: "eating out",
	gas: "gas bill",
	flight: "transport",
	train: "transport",
	uber: "transport",
	ola: "transport",
	zomato: "eating out",
	swiggy: "eating out",
	amazon: "shopping",
	flipkart: "shopping",
	myntra: "shopping",
	pharmacy: "medicines",
	medical: "medicines",
	hospital: "medicines",
};

/**
 * Ensures the categories context dictionary exists, or creates it if missing.
 */
async function loadContext(): Promise<Record<string, string>> {
	try {
		const data = await fs.readFile(CONTEXT_FILE, "utf-8");
		return JSON.parse(data);
	} catch (err: unknown) {
		const error = err as NodeJS.ErrnoException;
		if (error.code === "ENOENT") {
			await saveContext(DEFAULT_CONTEXT);
			return DEFAULT_CONTEXT;
		}
		throw err;
	}
}

async function saveContext(context: Record<string, string>): Promise<void> {
	await fs.writeFile(CONTEXT_FILE, JSON.stringify(context, null, 2), "utf-8");
}

/**
 * Prepares the system prompt to instruct the LLM on categorization logic
 * using few-shot classification based on the Zod enum and user dictionary.
 */
function buildSystemPrompt(
	contextRules: Record<string, string>,
	count: number,
): string {
	const validCategories = CategorySchema.options;
	const contextJsonStr = JSON.stringify(contextRules, null, 2);

	return `You are an expert personal finance categorization assistant running locally.
Your job is to read a JSON object of ${count} transaction narrations mapping an ID to a string, and strictly categorize them into ONE of these exact categories:
${JSON.stringify(validCategories)}

If no specific category fits perfectly, or if the narration is ambiguous, map it to "misc".
You must examine the known mappings (knowledge base) as a guiding signal:
${contextJsonStr}

Respond ONLY with a valid JSON object mapping the exact same IDs to the category string.
Example Output for 2 transactions:
{
  "0": "grocery",
  "1": "transport"
}
Do not add markdown formatting (\`\`\`json) or any conversational text. Return the raw JSON object.`;
}

/**
 * Sends a batch of transaction string narratives to Ollama for evaluation.
 */
export async function categorizeTransactionsBatch(
	transactions: Transaction[],
	modelName: string = "llama3",
): Promise<Transaction[]> {
	if (transactions.length === 0) return transactions;

	const context = await loadContext();
	const systemPrompt = buildSystemPrompt(context, transactions.length);

	const inputMap: Record<string, string> = {};
	for (let i = 0; i < transactions.length; i++) {
		inputMap[i.toString()] =
			transactions[i].description || transactions[i].merchant;
	}
	const userPrompt = `Classify these ${transactions.length} transactions:\n${JSON.stringify(inputMap, null, 2)}`;

	try {
		console.log(
			`Sending ${transactions.length} transactions to Ollama (${modelName})...`,
		);
		const response = await fetch("http://localhost:11434/api/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: modelName,
				system: systemPrompt,
				prompt: userPrompt,
				stream: false,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Ollama API error: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as { response: string };
		const responseText = data.response.trim();

		// Clean up markdown ticks if the LLM ignored our instruction
		let rawJSON = responseText;
		if (rawJSON.startsWith("```json")) {
			rawJSON = rawJSON
				.replace(/^```json/, "")
				.replace(/```$/, "")
				.trim();
		} else if (rawJSON.startsWith("```")) {
			rawJSON = rawJSON.replace(/^```/, "").replace(/```$/, "").trim();
		}

		const predictedCategories: Record<string, string> = JSON.parse(rawJSON);

		if (Object.keys(predictedCategories).length < transactions.length * 0.5) {
			console.warn(
				`LLM returned severely mismatched count (${Object.keys(predictedCategories).length} vs ${transactions.length}). Returning unmapped.`,
			);
			return transactions;
		}

		// Apply categories to transactions and update dictionary with high-confidence new findings
		let dictionaryUpdated = false;

		for (let i = 0; i < transactions.length; i++) {
			const tx = transactions[i];
			let predicted = predictedCategories[i.toString()];

			if (typeof predicted === "string") {
				predicted = predicted.toLowerCase().trim();
			} else {
				continue; // LLM missed this ID
			}

			// Validate output against Zod schema
			const parsed = CategorySchema.safeParse(predicted);
			if (parsed.success) {
				tx.category = parsed.data;

				// Simple auto-update dictionary heuristic
				// If this is a very simple 1-2 word merchant text without digits, save it to context for future speedups
				const cleanMerchantText = tx.merchant
					.toLowerCase()
					.replace(/[^a-z\s]/g, "")
					.trim();
				const wordCount = cleanMerchantText.split(/\s+/).length;

				if (wordCount > 0 && wordCount <= 3 && cleanMerchantText.length > 3) {
					if (!context[cleanMerchantText] && parsed.data !== "misc") {
						context[cleanMerchantText] = parsed.data;
						dictionaryUpdated = true;
					}
				}
			} else {
				console.warn(
					`Failed to parse category: "${predictedCategories[i.toString()]}" into schema.`,
				);
			}
		}

		if (dictionaryUpdated) {
			await saveContext(context);
			console.log("Updated categories-context.json with new learnings.");
		}

		return transactions;
	} catch (error: unknown) {
		const err = error as Error & { cause?: { code?: string } };
		if (
			err.cause?.code === "ECONNREFUSED" ||
			err.message?.includes("fetch failed")
		) {
			throw new Error(
				"Ollama connection refused. Make sure Ollama is running (try 'ollama serve' or open the app) and your local model is pulled.",
			);
		}
		throw error;
	}
}
