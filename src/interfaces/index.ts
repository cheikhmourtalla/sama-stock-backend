import { CashType, PaymentMethod } from "../prisma/generated/prisma/client";

export type IOperation = {
  type: CashType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
};
