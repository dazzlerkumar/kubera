import type { Transaction } from "../../types/schema";
import type { ParserProfile } from "../parser";

export const HDFCCreditProfile: ParserProfile = {
	name: "HDFC Credit Card",
	sourceType: "credit_card",
	identityPattern: /HDFC BANK.*CREDIT CARD/i,
	parse: async (text: string): Promise<Transaction[]> => {
		// Rough regex for HDFC CC transactions: Date, Description, Amount, Cr/Dr
		// Example: 20/12/2023 AMAZON SELLER SERVICES 2,500.00 Dr
		const txRegex =
			/(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([\d,]+\.\d{2})\s+(Cr|Dr)/g;
		const transactions: Transaction[] = [];
		let match;

		while ((match = txRegex.exec(text)) !== null) {
			const dateStr = match[1];
			const rawDesc = match[2];
			const amountStr = match[3];
			const type = match[4];

			if (!dateStr || !rawDesc || !amountStr || !type) continue;

			const amount = parseFloat(amountStr.replace(/,/g, ""));
			const direction = type === "Dr" ? "debit" : "credit";

			const importedAt = new Date().toISOString();
			const description = rawDesc.trim();

			// Basic fingerprint: date + description + amount + direction
			const fingerprintSource = `${dateStr}|${description}|${amount}|${direction}`;
			const hasher = new Bun.CryptoHasher("sha256");
			hasher.update(fingerprintSource);
			const fingerprint = hasher.digest("hex");

			transactions.push({
				date: dateStr,
				amount,
				direction,
				merchant: description,
				description,
				source: "credit_card",
				monthSheet: "Auto",
				fingerprint,
				importedAt,
			});
		}

		return transactions;
	},
};
