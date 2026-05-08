import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ClientService } from "../services/client.service";
export const getClients = async (_req: Request, res: Response) => {
  
  const clients = await ClientService.getClient();
  return res
    .status(200)
    .json({ success: true, data: clients, message: "Client list" });
};



export const getClientById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    const totalPurchases = client.sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const totalPaid = client.sales.reduce(
      (sum, sale) => sum + sale.paidAmount,
      0
    );
    const totalRemaining = client.sales.reduce(
      (sum, sale) => sum + sale.remaining,
      0
    );

    return res.status(200).json({
      ...client,
      totalPurchases,
      totalPaid,
      totalRemaining,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération du client",
      error,
    });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Le nom et le téléphone sont obligatoires",
      });
    }

    const existingClient = await prisma.client.findUnique({
      where: { phone },
    });

    if (existingClient) {
      return res.status(400).json({
        message: "Un client avec ce numéro existe déjà",
      });
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
      },
    });

    return res.status(201).json({
      message: "Client créé avec succès",
      client,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la création du client",
      error,
    });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, phone } = req.body;

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    const clientWithPhone = await prisma.client.findFirst({
      where: {
        phone,
        NOT: {
          id,
        },
      },
    });

    if (clientWithPhone) {
      return res.status(400).json({
        message: "Un autre client utilise déjà ce numéro",
      });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
      },
    });

    return res.status(200).json({
      message: "Client modifié avec succès",
      client: updatedClient,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la modification du client",
      error,
    });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: true,
      },
    });

    if (!existingClient) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    if (existingClient.sales.length > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer un client ayant déjà des ventes",
      });
    }

    await prisma.client.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Client supprimé avec succès",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la suppression du client",
      error,
    });
  }
};