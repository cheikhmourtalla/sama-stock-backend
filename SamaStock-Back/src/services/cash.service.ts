import { IOperation } from "../interfaces";
import { prisma } from "./../config/prisma";

export const cashService = {
  addOp: async (op: IOperation) => {
    const res = await prisma.transaction.create({ data: op });
    return res;
  },

  findOps: async () => {
    const res = await prisma.transaction.findMany();
    console.log(res);
    return res;
  },
};
