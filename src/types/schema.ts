import { z } from "zod";

export const DirectionSchema = z.enum(["debit", "credit"]);
export type Direction = z.infer<typeof DirectionSchema>;

export const SourceTypeSchema = z.enum(["credit_card", "debit_upi"]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const TransactionSchema = z.object({
  date: z.string(), // ISO DD-MM-YYYY or similar as per roadmap
  amount: z.number(),
  direction: DirectionSchema,
  merchant: z.string(),
  description: z.string(),
  source: SourceTypeSchema,
  monthSheet: z.string(), // e.g., "Dec 25"
  fingerprint: z.string(), // sha256/sha1 for idempotency
  importedAt: z.string(), // ISO timestamp
});

export type Transaction = z.infer<typeof TransactionSchema>;
