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

  customer: z.string().trim().max(100, "Nom trop long").optional(),

  note: z.string().trim().max(500, "Note trop longue").optional(),
});

export type CreateSaleDto = z.infer<typeof CreateSaleSchema>;
export const UpdateSaleSchema = z.object({
  customer: z
    .string()
    .trim()
    .max(100)
    .optional(),

  note: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export type UpdateSaleDto = z.infer<typeof UpdateSaleSchema>;

export const AddSalePaymentSchema = z.object({
  amount: z
    .number("Le montant est obligatoire")
    .positive("Le montant doit être supérieur à 0"),
});

export type AddSalePaymentDto = z.infer<typeof AddSalePaymentSchema>;

