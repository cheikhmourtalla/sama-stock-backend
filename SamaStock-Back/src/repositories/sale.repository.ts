import { prisma } from "../config/prisma";

import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

const includeRelations = {
  product: true,
  client: true,
};

export const SaleRepository = {
  findAll() {
    return prisma.sale.findMany({
      include: includeRelations,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: number) {
    return prisma.sale.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  create(
    tx: Prisma.TransactionClient,
    data: Prisma.SaleUncheckedCreateInput,
  ) {
    return tx.sale.create({
      data,
      include: includeRelations,
    });
  },

  update(
    id: number,
    data: Prisma.SaleUpdateInput,
  ) {
    return prisma.sale.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(
    tx: Prisma.TransactionClient,
    id: number,
  ) {
    return tx.sale.delete({
      where: { id },
    });
  },
};