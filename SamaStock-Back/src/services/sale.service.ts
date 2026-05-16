import { prisma } from "../config/prisma";

import { SaleRepository } from "../repositories/sale.repository";

import { CreateSaleDto, UpdateSaleDto } from "../dto/sale/sale.dto";
import { error } from "node:console";

export const SaleService = {
  async getSales() {
    return SaleRepository.findAll();
  },

  async getSaleById(id: number) {
    if (!id) {
      throw new Error("Identifiant invalide");
    }

    const sale = await SaleRepository.findById(id);

    if (!sale) {
      throw new Error("Vente introuvable");
    }

    return sale;
  },

  async createSale(data: CreateSaleDto, saleId?: string) {
    const { productId, clientId, quantity, paidAmount, customer, note } = data;

    console.log(paidAmount);

    if (quantity <= 0) {
      throw new Error("Quantité invalide");
    }

    return prisma.$transaction(async (tx) => {
      // product
      const product = await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        throw new Error("Produit introuvable");
      }

      // atomic stock update
      const updated = await tx.product.updateMany({
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

      if (updated.count === 0) {
        throw new Error("Stock insuffisant");
      }

      // client
      let client = null;

      if (clientId) {
        client = await tx.client.findUnique({
          where: {
            id: clientId,
          },
        });

        if (!client) {
          throw new Error("Client introuvable");
        }
      }

      // prices
      const unitPrice = Number(product.salePrice);

      const totalAmount = unitPrice * quantity;

      const paid = Number(paidAmount ?? totalAmount);

      if (paid < 0 || paid > totalAmount) {
        throw new Error("Montant payé invalide");
      }

      const remaining = totalAmount - paid;

      // create sale
      const sale = await tx.sale.create({
        data: {
          productId,
          clientId: clientId ?? null,
          quantity,
          unitPrice,
          totalAmount,
          paidAmount: paid,
          remaining,
          customer: customer ?? client?.name ?? null,
          note: note ?? null,
        },
        include: {
          product: true,
          client: true,
        },
      });

      // stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: "SALE",
          quantity,
          note: note ?? "Vente effectuée",
        },
      });

      const currentSession = await tx.cashSession.findFirst({
        orderBy: { openedAt: "desc" },
      });

      if (!currentSession?.isOpen) {
        throw new Error("Caisse fermer");
      }

      await tx.cashMovement.create({
        data: {
          sessionId: currentSession.id,
          type: "SALE",
          label: "Vente",
          amount: paidAmount as number,
          paymentMethod: "CASH",
        },
      });

      return;
    });
  },

  async updateSale(id: number, data: UpdateSaleDto) {
    const existingSale = await SaleRepository.findById(id);

    if (!existingSale) {
      throw new Error("Vente introuvable");
    }

    return SaleRepository.update(id, {
      customer: data.customer ?? existingSale.customer,
      note: data.note ?? existingSale.note,
    });
  },

  async addSalePayment(saleId: number, paidAmount: number) {
    const payment = prisma.$transaction(async (tx) => {
      //  find the product
      const findSale = await tx.sale.findUnique({
        where: { id: saleId },
      });

      if (!paidAmount || paidAmount <= 0) {
        throw new Error("Le montant du vensement est incorect ");
      }

      if (!findSale?.remaining) {
        throw new Error("Impossible de trouver le  rest");
      }

      //  the versed amount should not be > to the remainig amount
      if (paidAmount > findSale.remaining) {
        console.error(
          `Le montant definit est superieur au reste ( ${findSale.remaining} fcfa )`,
        );
        throw new Error("Le montant definit est superieur au reste.");
      }

      // check if the versed amount = remaing amount , if true , remainng = 0
      const isCompletePayment =
        findSale?.remaining === paidAmount ? true : false;

      // calculate the new remaning
      const restPayment = !isCompletePayment
        ? findSale.remaining - paidAmount
        : 0;

      //  set remaining to 0
      await tx.sale.update({
        where: { id: saleId },
        data: {
          remaining: isCompletePayment ? 0 : restPayment,
        },
      });
      console.log(restPayment);

      const currentCashSession = await tx.cashSession.findFirst({
        orderBy: { openedAt: "desc" },
      });

      if (!currentCashSession || !currentCashSession.isOpen) {
        console.error(`current Session : ${currentCashSession}`);
        throw new Error("Erreur avec la caisse. La Caisse  est il ouverte?");
      }

      await tx.cashMovement.create({
        data: {
          sessionId: currentCashSession.id,
          type: "CLIENT_PAYMENT",
          label: "Versement dette",
          amount: paidAmount,
          paymentMethod: "CASH",
        },
      });

      console.log(findSale);
      console.log(isCompletePayment);
    });

    return payment;

    // check  check the reste if the versed is not complet
  },

  async deleteSale(id: number) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          product: true,
        },
      });

      if (!sale) {
        throw new Error("Vente introuvable");
      }

      // restore stock
      await tx.product.update({
        where: {
          id: sale.productId,
        },
        data: {
          quantity: {
            increment: sale.quantity,
          },
        },
      });

      // movement
      await tx.stockMovement.create({
        data: {
          productId: sale.productId,
          type: "ENTRY",
          quantity: sale.quantity,
          note: "Suppression vente",
        },
      });

      // delete
      await tx.sale.delete({
        where: {
          id,
        },
      });

      return true;
    });
  },
};

//  //  find the product
//     const findSale = await prisma.sale.findUnique({
//       where: { id: saleId },
//     });

//     if (!amount) {
//       throw new Error("Le montant du vensement est incorect ");
//     }

//     if (!findSale?.remaining) {
//       throw new Error("Impossible de trouver le  rest");
//     }

//     //  the versed amount should not be > to the remainig amount
//     if (amount > findSale.remaining) {
//       console.error(
//         `Le montant definit est superieur au reste ( ${findSale.remaining} fcfa )`,
//       );
//       throw new Error("Le montant definit est superieur au reste.");
//     }

//     // check if the versed amount = remaing amount , if true , remainng = 0
//     const isComplete = findSale?.remaining === amount ? true : false;
//     if(isComplete){
//       const validateSale = prisma.sale.update ({
//         where : {id  : saleId},
//         data : {
//           remaining : 0
//         }
//       })
//     }

//     console.log(findSale);
//     console.log(isComplete);

//     // check  check the reste if the versed is not complet
