import { z } from "zod";

export const CreateSaleSchema = z.object({
  productId: z.number("Le produit est obligatoire"),

  clientId: z.number().optional(),

  quantity: z
    .number("La quantité est obligatoire")
    .positive("La quantité doit être supérieure à 0"),

  paidAmount: z
    .number()
    .min(0, "Le montant payé ne peut pas être négatif")
    .optional(),

  paymentMethod: z
    .enum(["CASH", "WAVE", "ORANGE_MONEY"])
    .optional()
    .default("CASH"),

  customer: z.string().trim().max(100, "Nom trop long").optional(),

  note: z.string().trim().max(500, "Note trop longue").optional(),
});

export type CreateSaleDto = z.infer<typeof CreateSaleSchema>;
export const UpdateSaleSchema = z.object({
  customer: z.string().trim().max(100).optional(),

  note: z.string().trim().max(500).optional(),
});

export type UpdateSaleDto = z.infer<typeof UpdateSaleSchema>;

export const AddSalePaymentSchema = z.object({
  amount: z
    .number("Le montant est obligatoire")
    .positive("Le montant doit être supérieur à 0"),

  paymentMethod: z
    .enum(["CASH", "WAVE", "ORANGE_MONEY"])
    .optional()
    .default("CASH"),
});

export interface CreateSale {
  items: {
    productId: number;
    quantity: number;
    unitPrice?: number;
  }[];

  clientId?: number;

  paidAmount?: number;

  paymentMethod?: "CASH" | "WAVE" | "ORANGE_MONEY";

  customer?: string;

  note?: string;
}

export type AddSalePaymentDto = z.infer<typeof AddSalePaymentSchema>;
