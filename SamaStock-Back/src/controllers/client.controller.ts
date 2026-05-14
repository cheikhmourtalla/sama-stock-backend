import { Request, Response } from "express";
import { ClientService } from "../services/client.service";

export const clientController = {

  // get clients
  async getClients(_req: Request, res: Response) {
    const clients = await ClientService.getClient();

    return res.status(200).json({
      success: true,
      data: clients,
      message: "Liste des clients",
    });
  },

  // get one client
  async getClient(req: Request, res: Response) {
    const id = Number(req.params.id);

    const client = await ClientService.getClientById(id);

    return res.status(200).json({
      success: true,
      data: client,
      message: "Client trouvé",
    });
  },

  // create client
  async createClient(req: Request, res: Response) {
    const { name, phone } = req.body;

    const client = await ClientService.createClient(
      name,
      phone,
    );

    return res.status(201).json({
      success: true,
      data: client,
      message: "Client créé avec succès",
    });
  },

  // update client
  async updateClient(req: Request, res: Response) {
    const id = Number(req.params.id);

    const { name, phone } = req.body;

    const updatedClient =
      await ClientService.updateClient(
        id,
        name,
        phone,
      );

    return res.status(200).json({
      success: true,
      data: updatedClient,
      message: "Client modifié avec succès",
    });
  },

  // delete client
  async deleteClient(req: Request, res: Response) {
    const id = Number(req.params.id);

    await ClientService.deleteClient(id);

    return res.status(200).json({
      success: true,
      message: "Client supprimé avec succès",
    });
  },
};