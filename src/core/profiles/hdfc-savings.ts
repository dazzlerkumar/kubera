import type { Transaction } from "../../types/schema";
import type { ParserProfile } from "../parser";

export const HDFCSavingsProfile: ParserProfile = {
    name: "HDFC Savings Account",
    sourceType: "debit_upi",
    identityPattern: /HDFC BANK[\s\S]*SAVINGS A\/C/i,
    parse: async (text: string): Promise<Transaction[]> => {
        const transactions: Transaction[] = [];

        const summaryMatch = text.match(/Opening Balance[\s\S]*?\n([\d,]+\.\d{2})/);
        let currentBalance = summaryMatch?.[1]
            ? parseFloat(summaryMatch[1].replace(/,/g, ""))
            : 0;

        let cleanedText = text.replace(/Page No \.:[\s\S]*?-- \d+ of \d+ --/g, "");
        cleanedText = cleanedText.split("STATEMENT SUMMARY")[0] || cleanedText;
        const lines = cleanedText.split("\n").map((l) => l.trim()).filter(Boolean);

        const blockRegex =
            /^(\d{2}\/\d{2}\/\d{2})\s+(.*?)\s+(\S+)\s+(\d{2}\/\d{2}\/\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})(.*)$/;

        interface PendingTx {
            date: string;
            narration: string;
            refNo: string;
            valueDt: string;
            amount: number;
            closingBalance: number;
        }

        const finalizeTx = (tx: PendingTx) => {
            let direction: "credit" | "debit" = "debit";
            if (Math.abs(currentBalance + tx.amount - tx.closingBalance) < 0.01) {
                direction = "credit";
            }
            currentBalance = tx.closingBalance;

            const monthSheet = "Auto";
            const importedAt = new Date().toISOString();
            const hasher = new Bun.CryptoHasher("sha256");
            const fingerprintSource = `${tx.date}|${tx.refNo}|${tx.amount}|${direction}`;
            hasher.update(fingerprintSource);
            const fingerprint = hasher.digest("hex");

            return {
                date: tx.date,
                amount: tx.amount,
                direction,
                merchant: tx.narration,
                description: tx.narration,
                source: "debit_upi",
                monthSheet,
                fingerprint,
                importedAt,
            } as Transaction;
        };

        const blocks: string[] = [];
        let currentBlock = "";

        for (const line of lines) {
            if (/^\d{2}\/\d{2}\/\d{2}\s/.test(line)) {
                if (currentBlock) blocks.push(currentBlock.trim());
                currentBlock = line;
            } else if (currentBlock) {
                currentBlock += " " + line;
            }
        }
        if (currentBlock) blocks.push(currentBlock.trim());

        for (const block of blocks) {
            const match = block.match(blockRegex);
            if (match && match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
                const tx: PendingTx = {
                    date: match[1],
                    narration: (match[2] + " " + (match[7] || "")).trim(),
                    refNo: match[3],
                    valueDt: match[4],
                    amount: parseFloat(match[5].replace(/,/g, "")),
                    closingBalance: parseFloat(match[6].replace(/,/g, "")),
                };
                transactions.push(finalizeTx(tx));
            } else {
                console.warn("Failed to parse block:", block);
            }
        }

        return transactions;
    },
};
