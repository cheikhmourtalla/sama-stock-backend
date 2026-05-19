import { CashType, PaymentMethod } from "../../prisma/generated/prisma/client.js";

export type IOperation = {
  type: CashType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
};
