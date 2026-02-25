import { z } from "zod";

export const DirectionSchema = z.enum(["debit", "credit"]);
export type Direction = z.infer<typeof DirectionSchema>;

export const SourceTypeSchema = z.enum(["credit_card", "debit_upi"]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const CategorySchema = z.enum([
	"grocery",
	"transport",
	"electricity bill",
	"phone/wifi bill",
	"gas bill",
	"medicines",
	"sibling education",
	"dependents",
	"eating out",
	"entertainment",
	"shopping",
	"house maintenance",
	"cash withdrawal",
	"debt",
	"misc",
	"invested",
]);
export type Category = z.infer<typeof CategorySchema>;

export const TransactionSchema = z.object({
	date: z.string(), // ISO DD-MM-YYYY or similar as per roadmap
	amount: z.number(),
	direction: DirectionSchema,
	merchant: z.string(),
	description: z.string(),
	source: SourceTypeSchema,
	category: CategorySchema.optional(),
	monthSheet: z.string(), // e.g., "Dec 25"
	fingerprint: z.string(), // sha256/sha1 for idempotency
	importedAt: z.string(), // ISO timestamp
});

export type Transaction = z.infer<typeof TransactionSchema>;
