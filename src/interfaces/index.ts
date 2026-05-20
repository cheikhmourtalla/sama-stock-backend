import { CashType, PaymentMethod } from "../../generated/prisma/client.js";

export type IOperation = {
  type: CashType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
};
