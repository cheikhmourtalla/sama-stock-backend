// controllers/client.controller.ts
import { Request, Response } from "express";
import { ClientService } from "../services/client.service";
import loggerService from "../services/logger.service";

export const clientController = {

  // get clients
  async getClients(_req: Request, res: Response) {
    const logger = loggerService.getLogger("ClientController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération de la liste des clients`, {
      requestId,
      ip: _req.ip
    });

    const clients = await ClientService.getClient();

    logger.info(`Liste des clients récupérée`, {
      requestId,
      count: clients?.length || 0
    });

    return res.status(200).json({
      success: true,
      data: clients,
      message: "Liste des clients",
    });
  },

  // get one client
  async getClient(req: Request, res: Response) {
    const logger = loggerService.getLogger("ClientController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);

    logger.debug(`Recherche du client ID: ${id}`, {
      requestId,
      clientId: id,
      ip: req.ip
    });

    const client = await ClientService.getClientById(id);

    logger.info(`Client trouvé ID: ${id}`, {
      requestId,
      clientId: id,
      clientName: client?.name
    });

    return res.status(200).json({
      success: true,
      data: client,
      message: "Client trouvé",
    });
  },

  // create client
  async createClient(req: Request, res: Response) {
    const logger = loggerService.getLogger("ClientController");
    const requestId = (req as any).requestId;
    const { name, phone } = req.body;

    logger.info(`Tentative de création d'un nouveau client`, {
      requestId,
      clientName: name,
      phone,
      ip: req.ip
    });

    const client = await ClientService.createClient(name, phone);

    logger.info(`Client créé avec succès`, {
      requestId,
      clientId: client?.id,
      clientName: name
    });

    return res.status(201).json({
      success: true,
      data: client,
      message: "Client créé avec succès",
    });
  },

  // update client
  async updateClient(req: Request, res: Response) {
    const logger = loggerService.getLogger("ClientController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);
    const { name, phone } = req.body;

    logger.info(`Tentative de modification du client ID: ${id}`, {
      requestId,
      clientId: id,
      newName: name,
      newPhone: phone,
      ip: req.ip
    });

    const updatedClient = await ClientService.updateClient(id, name, phone);

    logger.info(`Client modifié avec succès ID: ${id}`, {
      requestId,
      clientId: id,
      clientName: updatedClient?.name
    });

    return res.status(200).json({
      success: true,
      data: updatedClient,
      message: "Client modifié avec succès",
    });
  },

  // delete client
  async deleteClient(req: Request, res: Response) {
    const logger = loggerService.getLogger("ClientController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);

    logger.warn(`Tentative de suppression du client ID: ${id}`, {
      requestId,
      clientId: id,
      ip: req.ip
    });

    await ClientService.deleteClient(id);

    logger.info(`Client supprimé avec succès ID: ${id}`, {
      requestId,
      clientId: id
    });

    return res.status(200).json({
      success: true,
      message: "Client supprimé avec succès",
    });
  },
};