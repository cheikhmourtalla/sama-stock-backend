// controllers/product.controller.ts
import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import loggerService from "../services/logger.service";

export const productController = {

  // get products
  async getProducts(req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (req as any).requestId;

    const search = typeof req.query.search === "string" ? req.query.search : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    logger.debug(`Récupération des produits`, {
      requestId,
      search,
      category,
      page,
      limit,
      ip: req.ip
    });

    const result = await ProductService.getProducts(search, category, page, limit);

    logger.info(`Liste des produits récupérée`, {
      requestId,
      count: result.products?.length || 0,
      total: result.pagination?.total || 0,
      page
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  },

  // get one product
  async getProductById(req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);

    logger.debug(`Recherche du produit ID: ${id}`, {
      requestId,
      productId: id,
      ip: req.ip
    });

    const product = await ProductService.getProductById(id);

    logger.info(`Produit trouvé ID: ${id}`, {
      requestId,
      productId: id,
      productName: product?.name
    });

    return res.status(200).json({
      success: true,
      data: product,
    });
  },

  // create product
  async createProduct(req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (req as any).requestId;
    const productData = req.body;

    logger.info(`Tentative de création d'un nouveau produit`, {
      requestId,
      productName: productData?.name,
      price: productData?.price,
      quantity: productData?.quantity,
      ip: req.ip
    });

    const product = await ProductService.createProduct(req.body);

    logger.info(`Produit créé avec succès`, {
      requestId,
      productId: product?.id,
      productName: product?.name
    });

    return res.status(201).json({
      success: true,
      data: product,
      message: "Produit ajouté avec succès",
    });
  },

  // update product
  async updateProduct(req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);
    const updateData = req.body;

    logger.info(`Tentative de modification du produit ID: ${id}`, {
      requestId,
      productId: id,
      updates: {
        name: updateData?.name,
        price: updateData?.price,
        quantity: updateData?.quantity
      },
      ip: req.ip
    });

    const updatedProduct = await ProductService.updateProduct(id, req.body);

    logger.info(`Produit modifié avec succès ID: ${id}`, {
      requestId,
      productId: id,
      productName: updatedProduct?.name
    });

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Produit modifié avec succès",
    });
  },

  // delete product
  async deleteProduct(req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);

    logger.warn(`Tentative de suppression du produit ID: ${id}`, {
      requestId,
      productId: id,
      ip: req.ip
    });

    await ProductService.deleteProduct(id);

    logger.info(`Produit supprimé avec succès ID: ${id}`, {
      requestId,
      productId: id
    });

    return res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès",
    });
  },

  // low stock
  async getLowStockProducts(_req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération des produits en stock faible`, {
      requestId,
      ip: _req.ip
    });

    const products = await ProductService.getLowStockProducts();

    logger.info(`Produits en stock faible récupérés`, {
      requestId,
      count: products?.length || 0
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  },

  // out of stock
  async getOutOfStockProducts(_req: Request, res: Response) {
    const logger = loggerService.getLogger("ProductController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération des produits en rupture de stock`, {
      requestId,
      ip: _req.ip
    });

    const products = await ProductService.getOutOfStockProducts();

    logger.info(`Produits en rupture de stock récupérés`, {
      requestId,
      count: products?.length || 0
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  },
};