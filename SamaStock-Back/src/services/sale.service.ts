import { prisma } from "../config/prisma";

import { SaleRepository } from "../repositories/sale.repository";

import {
  CreateSaleDto,
  UpdateSaleDto,
} from "../dto/sale/sale.dto";

export const SaleService = {
  async getSales() {
    return SaleRepository.findAll();
  },

  async getSaleById(id: number) {
    if (!id) {
      throw new Error("Identifiant invalide");
    }

    const sale =
      await SaleRepository.findById(id);

    if (!sale) {
      throw new Error(
        "Vente introuvable",
      );
    }

    return sale;
  },

  async createSale(
    data: CreateSaleDto,
  ) {
    const {
      productId,
      clientId,
      quantity,
      paidAmount,
      customer,
      note,
    } = data;

    return prisma.$transaction(
      async (tx) => {
        // product
        const product =
          await tx.product.findUnique({
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new Error(
            "Produit introuvable",
          );
        }

        // stock atomic update
        const stockUpdate =
          await tx.product.updateMany({
            where: {
              id: productId,
              quantity: {
                gte: quantity,
              },
            },

            data: {
              quantity: {
                decrement: quantity,
              },
            },
          });

        if (
          stockUpdate.count === 0
        ) {
          throw new Error(
            "Stock insuffisant",
          );
        }

        // client
        let client = null;

        if (clientId) {
          client =
            await tx.client.findUnique({
              where: {
                id: clientId,
              },
            });

          if (!client) {
            throw new Error(
              "Client introuvable",
            );
          }
        }

        // pricing
        const unitPrice = Number(
          product.salePrice,
        );

        const totalAmount =
          unitPrice * quantity;

        const paid = Number(
          paidAmount ?? totalAmount,
        );

        if (
          paid < 0 ||
          paid > totalAmount
        ) {
          throw new Error(
            "Montant invalide",
          );
        }

        const remaining =
          totalAmount - paid;

        // sale
        const sale =
          await SaleRepository.create(
            tx,
            {
              productId,
              clientId:
                clientId ?? null,
              quantity,
              unitPrice,
              totalAmount,
              paidAmount: paid,
              remaining,
              customer:
                customer ??
                client?.name ??
                null,
              note:
                note ?? null,
            },
          );

        // stock movement
        await tx.stockMovement.create({
          data: {
            productId,
            type: "SALE",
            quantity,
            note:
              note ??
              "Vente effectuée",
          },
        });

        return sale;
      },
    );
  },

  async updateSale(
    id: number,
    data: UpdateSaleDto,
  ) {
    const sale =
      await SaleRepository.findById(id);

    if (!sale) {
      throw new Error(
        "Vente introuvable",
      );
    }

    return SaleRepository.update(
      id,
      {
        customer:
          data.customer ??
          sale.customer,

        note:
          data.note ??
          sale.note,
      },
    );
  },

  async deleteSale(id: number) {
    return prisma.$transaction(
      async (tx) => {
        const sale =
          await tx.sale.findUnique({
            where: { id },

            include: {
              product: true,
            },
          });

        if (!sale) {
          throw new Error(
            "Vente introuvable",
          );
        }

        // restore stock
        await tx.product.update({
          where: {
            id: sale.productId,
          },

          data: {
            quantity: {
              increment:
                sale.quantity,
            },
          },
        });

        // stock movement
        await tx.stockMovement.create({
          data: {
            productId:
              sale.productId,

            type: "ENTRY",

            quantity:
              sale.quantity,

            note:
              "Suppression vente",
          },
        });

        await SaleRepository.delete(
          tx,
          id,
        );

        return true;
      },
    );
  },

  async addSalePayment(
    saleId: number,
    amount: number,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const sale =
          await tx.sale.findUnique({
            where: {
              id: saleId,
            },

            include: {
              product: true,
              client: true,
            },
          });

        if (!sale) {
          throw new Error(
            "Vente introuvable",
          );
        }

        if (sale.remaining <= 0) {
          throw new Error(
            "Vente déjà soldée",
          );
        }

        if (
          amount >
          sale.remaining
        ) {
          throw new Error(
            "Montant supérieur au reste",
          );
        }

        return tx.sale.update({
          where: {
            id: saleId,
          },

          data: {
            paidAmount: {
              increment: amount,
            },

            remaining: {
              decrement: amount,
            },
          },

          include: {
            product: true,
            client: true,
          },
        });
      },
    );
  },
};