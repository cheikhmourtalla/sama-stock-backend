import {  } from './product.controller';
import { Request, Response } from "express";
import { prisma } from "../config/prisma";


export const getProducts = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const category =
      typeof req.query.category === "string" ? req.query.category : "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
      };
    }

    if (category) {
      where.category = category;
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return res.status(200).json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des produits",
      error,
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID invalide",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération du produit",
      error,
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      quantity,
      purchasePrice,
      salePrice,
      alertThreshold,
    } = req.body;

    if (
      !name ||
      purchasePrice == null ||
      salePrice == null
    ) {
      return res.status(400).json({
        message: "Les champs obligatoires sont manquants",
      });
    }

    

    const product = await prisma.product.create({
      data: {
        name,
        description,
        quantity: quantity ?? 0,
        purchasePrice,
        salePrice,
        alertThreshold: alertThreshold ?? 5,
      },
    });

    return res.status(201).json({
      message: "Produit ajouté avec succès",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'ajout du produit",
      error,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID invalide",
      });
    }

    const {
      name,
      description,
      quantity,
      purchasePrice,
      salePrice,
      alertThreshold,

    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }


      

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        quantity,
        purchasePrice,
        salePrice,
        alertThreshold,
    
      },
    });

    return res.status(200).json({
      message: "Produit modifié avec succès",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Erreur lors de la modification du produit",
      error,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID invalide",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Produit supprimé avec succès",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la suppression du produit",
      error,
    });
  }
};
export const getLowStockProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        quantity: "asc",
      },
    });

    const lowStockProducts = products.filter(
      (product) => product.quantity <= product.alertThreshold
    );

    return res.status(200).json(lowStockProducts);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des produits en stock faible",
      error,
    });
  }
};

export const getOutOfStockProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        quantity: 0,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des produits en rupture",
      error,
    });
  }
};