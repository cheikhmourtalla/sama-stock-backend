import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getSales = async (_req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        product: true,
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(sales);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des ventes",
      error,
    });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Identifiant de vente invalide",
      });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        client: true,
      },
    });

    if (!sale) {
      return res.status(404).json({
        message: "Vente introuvable",
      });
    }

    return res.status(200).json(sale);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération de la vente",
      error,
    });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const { productId, clientId, quantity, paidAmount, customer, note } =
      req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "productId et quantity sont obligatoires",
      });
    }

    const qty = Number(quantity);

    if (qty <= 0) {
      return res.status(400).json({
        message: "La quantité doit être supérieure à 0",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    if (product.quantity < qty) {
      return res.status(400).json({
        message: "Stock insuffisant pour effectuer cette vente",
      });
    }

    let client = null;

    if (clientId) {
      client = await prisma.client.findUnique({
        where: { id: Number(clientId) },
      });

      if (!client) {
        return res.status(404).json({
          message: "Client introuvable",
        });
      }
    }

    const unitPrice = Number(product.salePrice);
    const totalAmount = unitPrice * qty;
    const paid = Number(paidAmount ?? totalAmount);

    if (paid < 0 || paid > totalAmount) {
      return res.status(400).json({
        message: "Le montant payé est invalide",
      });
    }

    const remaining = totalAmount - paid;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        quantity: product.quantity - qty,
      },
    });

    const sale = await prisma.sale.create({
      data: {
        productId: Number(productId),
        clientId: clientId ? Number(clientId) : null,
        quantity: qty,
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

    await prisma.stockMovement.create({
      data: {
        productId: Number(productId),
        type: "SALE",
        quantity: qty,
        note: note ?? "Vente effectuée",
      },
    });

    return res.status(201).json({
      message: "Vente enregistrée avec succès",
      sale,
      product: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'enregistrement de la vente",
      error,
    });
  }
};

export const updateSale = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { note, customer } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Identifiant de vente invalide",
      });
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!existingSale) {
      return res.status(404).json({
        message: "Vente introuvable",
      });
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        note: note ?? existingSale.note,
        customer: customer ?? existingSale.customer,
      },
      include: {
        product: true,
        client: true,
      },
    });

    return res.status(200).json({
      message: "Vente modifiée avec succès",
      sale: updatedSale,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la modification de la vente",
      error,
    });
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Identifiant de vente invalide",
      });
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!existingSale) {
      return res.status(404).json({
        message: "Vente introuvable",
      });
    }

    await prisma.product.update({
      where: { id: existingSale.productId },
      data: {
        quantity: existingSale.product.quantity + existingSale.quantity,
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: existingSale.productId,
        type: "ENTRY",
        quantity: existingSale.quantity,
        note: "Annulation / suppression vente",
      },
    });

    await prisma.sale.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Vente supprimée avec succès",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la suppression de la vente",
      error,
    });
  }
};

export const addSalePayment = async (req: Request, res: Response) => {
  try {
    const saleId = Number(req.params.id);
    const { amount } = req.body;

    if (!saleId || amount === undefined || amount === null) {
      return res.status(400).json({
        message: "L'identifiant de la vente et le montant sont obligatoires",
      });
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        message: "Le montant doit être supérieur à 0",
      });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        product: true,
        client: true,
      },
    });

    if (!sale) {
      return res.status(404).json({
        message: "Vente introuvable",
      });
    }

    if (sale.remaining <= 0) {
      return res.status(400).json({
        message: "Cette vente est déjà totalement soldée",
      });
    }

    if (paymentAmount > sale.remaining) {
      return res.status(400).json({
        message: "Le montant dépasse le reste à payer",
      });
    }

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: sale.paidAmount + paymentAmount,
        remaining: sale.remaining - paymentAmount,
      },
      include: {
        product: true,
        client: true,
      },
    });

    return res.status(200).json({
      message: "Paiement ajouté avec succès",
      sale: updatedSale,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'ajout du paiement",
      error,
    });
  }
};