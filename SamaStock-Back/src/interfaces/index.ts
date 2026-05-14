import { CashType, PaymentMethod } from "@prisma/client";

export type IOperation = {
  type: CashType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
};
