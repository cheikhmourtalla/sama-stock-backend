import { CashType } from "@prisma/client";
import { IOperation } from "../interfaces";
import { prisma } from "./../config/prisma";
interface CreateTransactionDTO {
  sale_id?: number;
  type: CashType;
  label: string;
  amount: number;
  paymentMethod: "CASH" | "WAVE" | "ORANGE_MONEY";
}
export const cashService = {
  addOp: async (data: CreateTransactionDTO) => {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: data.type,
          label: data.label,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        },
      });

      let summary = await tx.transactionSummary.findFirst();

      if (!summary) {
        summary = await tx.transactionSummary.create({
          data: {
            transaction_id: transaction.id,
            balance: 0,
            entries: 0,
            exits: 0,
            transactions: 0,
          },
        });
      }

      const isEntry = data.type === "ENTRY";

      const newEntries = isEntry
        ? summary.entries + data.amount
        : summary.entries;

      const newExits = !isEntry ? summary.exits + data.amount : summary.exits;

      const newBalance = newEntries - newExits;

      await tx.transactionSummary.update({
        where: {
          id: summary.id,
        },
        data: {
          entries: newEntries,
          exits: newExits,
          balance: newBalance,
          transactions: {
            increment: 1,
          },
        },
      });

      return transaction;
    });
  },

  findOps: async () => {
    const res = await prisma.transaction.findMany({
    });
    console.log(res);
    return res.map(transactionMapperDto);
    return res;
  },
  findSummay: async () => {
    const res = await prisma.transactionSummary.findMany({
    });
    console.log(res);
    return res.map(summaryMapperDto);
    return res;
  },
};



export const transactionMapperDto = (transaction: any) => ({
  id: transaction.id,
  type: transaction.type,
  sale_id: transaction.sale_id,
  label: transaction.label,
  amount: transaction.amount,
  paymentMethod: transaction.paymentMethod,
  createdAt: transaction.createdAt,
});

export const summaryMapperDto = (s: any) => ({
  id: s.id,
  balance: s.balance,
  entries: s.entries,
  exits: s.exits,
  transactions: s.transactions,
});
