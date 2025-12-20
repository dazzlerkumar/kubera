import type { Transaction } from "../types/schema";

export interface ParserProfile {
    name: string;
    sourceType: "credit_card" | "debit_upi";
    // Pattern to identify if this profile fits the statement text
    identityPattern: RegExp;
    // Function to parse the extracted text into transactions
    parse: (text: string) => Promise<Transaction[]>;
}

export async function parseStatement(text: string, profiles: ParserProfile[]): Promise<Transaction[]> {
    const profile = profiles.find(p => p.identityPattern.test(text));
    if (!profile) {
        throw new Error("No matching parser profile found for this statement.");
    }
    console.log(`Matched profile: ${profile.name}`);
    return profile.parse(text);
}
