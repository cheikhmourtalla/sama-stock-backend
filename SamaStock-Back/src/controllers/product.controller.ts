import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

export const productController = {

  // get products
  async getProducts(req: Request, res: Response) {

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : "";

    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : "";

    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 10;

    const result =
      await ProductService.getProducts(
        search,
        category,
        page,
        limit,
      );

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  },

  // get one product
  async getProductById(
    req: Request,
    res: Response,
  ) {

    const id = Number(req.params.id);

    const product =
      await ProductService.getProductById(id);

    return res.status(200).json({
      success: true,
      data: product,
    });
  },

  // create product
  async createProduct(
    req: Request,
    res: Response,
  ) {

    const product =
      await ProductService.createProduct(
        req.body,
      );

    return res.status(201).json({
      success: true,
      data: product,
      message: "Produit ajouté avec succès",
    });
  },

  // update product
  async updateProduct(
    req: Request,
    res: Response,
  ) {

    const id = Number(req.params.id);

    const updatedProduct =
      await ProductService.updateProduct(
        id,
        req.body,
      );

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Produit modifié avec succès",
    });
  },

  // delete product
  async deleteProduct(
    req: Request,
    res: Response,
  ) {

    const id = Number(req.params.id);

    await ProductService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès",
    });
  },

  // low stock
  async getLowStockProducts(
    _req: Request,
    res: Response,
  ) {

    const products =
      await ProductService.getLowStockProducts();

    return res.status(200).json({
      success: true,
      data: products,
    });
  },

  // out of stock
  async getOutOfStockProducts(
    _req: Request,
    res: Response,
  ) {

    const products =
      await ProductService.getOutOfStockProducts();

    return res.status(200).json({
      success: true,
      data: products,
    });
  },
};