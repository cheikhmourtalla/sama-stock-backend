import { prisma } from "../config/prisma.js";
import { CashMovementType, PaymentMethod } from "@prisma/client";
import loggerService from "../services/logger.service.js";

const logger = loggerService.getLogger("CashService");

export const openCashSession = async (
  userId: number,
  openingAmount: number,
) => {
  logger.debug(`Tentative d'ouverture de caisse pour l'utilisateur: ${userId}`);

  const existingSession = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
  });

  if (existingSession) {
    logger.warn(`Tentative d'ouverture de caisse refusée - Une caisse est déjà ouverte (session: ${existingSession.id})`);
    throw new Error("Une caisse est déjà ouverte. Veuillez fermer la caisse actuelle avant d'en ouvrir une nouvelle.");
  }

  const session = await prisma.cashSession.create({
    data: {
      userId,
      openingAmount,
    },
  });

  logger.info(`Caisse ouverte avec succès - Session: ${session.id}, Utilisateur: ${userId}, Montant: ${openingAmount}`);
  
  return session;
};

export const closeCashSession = async () => {
  logger.debug(`Tentative de fermeture de caisse`);

  const session = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
    include: {
      movements: true,
    },
  });

  if (!session) {
    logger.warn(`Tentative de fermeture de caisse refusée - Aucune caisse ouverte trouvée`);
    throw new Error("Aucune caisse ouverte. Impossible de fermer une caisse inexistante.");
  }

  const entries = session.movements
    .filter(
      (m) =>
        m.type === CashMovementType.SALE ||
        m.type === CashMovementType.CLIENT_PAYMENT,
    )
    .reduce((acc, m) => acc + m.amount.toNumber(), 0);

  const outputs = session.movements
    .filter(
      (m) =>
        m.type === CashMovementType.SUPPLIER_PAYMENT ||
        m.type === CashMovementType.EXPENSE,
    )
    .reduce((acc, m) => acc + m.amount.toNumber(), 0);

  const closingAmount = session.openingAmount.toNumber() + entries - outputs;

  logger.debug(`Calcul de fermeture - Session: ${session.id}, Ouverture: ${session.openingAmount}, Entrées: ${entries}, Sorties: ${outputs}, Montant final: ${closingAmount}`);

  const closedSession = await prisma.cashSession.update({
    where: {
      id: session.id,
    },
    data: {
      isOpen: false,
      closedAt: new Date(),
      closingAmount,
    },
  });

  logger.info(`Caisse fermée avec succès - Session: ${session.id}, Montant d'ouverture: ${session.openingAmount}, Montant de fermeture: ${closingAmount}`);
  
  return closedSession;
};

export const getCurrentSession = async () => {
  logger.debug(`Récupération de la session de caisse actuelle`);

  const session = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
    include: {
      movements: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!session) {
    logger.debug(`Aucune session de caisse ouverte trouvée`);
  } else {
    logger.debug(`Session de caisse trouvée - ID: ${session.id}, Nombre de mouvements: ${session.movements?.length || 0}`);
  }

  return session;
};

export const addCashMovement = async (data: {
  type: CashMovementType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
}) => {
  logger.debug(`Tentative d'ajout de mouvement de caisse - Type: ${data.type}, Montant: ${data.amount}`);

  const session = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
  });

  if (!session) {
    logger.warn(`Tentative d'ajout de mouvement refusée - La caisse est fermée (Type: ${data.type}, Montant: ${data.amount})`);
    throw new Error("La caisse est fermée. Veuillez ouvrir la caisse avant d'enregistrer des mouvements.");
  }

  const movement = await prisma.cashMovement.create({
    data: {
      sessionId: session.id,
      type: data.type,
      label: data.label,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      note: data.note,
    },
  });

  logger.info(`Mouvement de caisse ajouté avec succès - Session: ${session.id}, Type: ${data.type}, Label: ${data.label}, Montant: ${data.amount}, Moyen: ${data.paymentMethod}`);
  
  return movement;
};

export const getCashHistory = async () => {
  logger.debug(`Récupération de l'historique des caisses`);

  const history = await prisma.cashSession.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      movements: true,
      user: {
        select: { name: true },
      },
    },
  });

  logger.info(`Historique des caisses récupéré - ${history.length} session(s) trouvée(s)`);
  
  return history;
};