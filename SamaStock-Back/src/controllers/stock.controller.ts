import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const addStockEntry = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, note } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "productId et quantity sont obligatoires",
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

    const updatedProduct = await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        quantity: product.quantity + Number(quantity),
      },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        productId: Number(productId),
        type: "ENTRY",
        quantity: Number(quantity),
        note,
      },
    });

    return res.status(201).json({
      message: "Entrée de stock enregistrée avec succès",
      product: updatedProduct,
      movement,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'entrée de stock",
      error,
    });
  }
};

export const addStockOut = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, note } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "productId et quantity sont obligatoires",
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

    if (product.quantity < Number(quantity)) {
      return res.status(400).json({
        message: "Stock insuffisant pour effectuer cette sortie",
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        quantity: product.quantity - Number(quantity),
      },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        productId: Number(productId),
        type: "OUT",
        quantity: Number(quantity),
        note,
      },
    });

    return res.status(201).json({
      message: "Sortie de stock enregistrée avec succès",
      product: updatedProduct,
      movement,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la sortie de stock",
      error,
    });
  }
};

export const getStockMovements = async (_req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(movements);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des mouvements",
      error,
    });
  }
};