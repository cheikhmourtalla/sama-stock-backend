import { CashType, PaymentMethod } from "../../prisma/prisma/generated/prisma";

export type IOperation = {
  type: CashType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
};
