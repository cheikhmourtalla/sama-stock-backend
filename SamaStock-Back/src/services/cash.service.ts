import { prisma } from "../config/prisma";
import { CashMovementType, PaymentMethod } from "@prisma/client";

export const openCashSession = async (
  userId: number,
  openingAmount: number,
) => {
  const existingSession = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
  });

  if (existingSession) {
    throw new Error("Une caisse est déjà ouverte");
  }

  return prisma.cashSession.create({
    data: {
      userId,
      openingAmount,
    },
  });
};

export const closeCashSession = async () => {
  const session = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
    include: {
      movements: true,
    },
  });

  if (!session) {
    throw new Error("Aucune caisse ouverte");
  }

  const entries = session.movements
    .filter(
      (m) =>
        m.type === CashMovementType.SALE ||
        m.type === CashMovementType.CLIENT_PAYMENT,
    )
    .reduce((acc, m) => acc + m.amount, 0);

  const outputs = session.movements
    .filter(
      (m) =>
        m.type === CashMovementType.SUPPLIER_PAYMENT ||
        m.type === CashMovementType.EXPENSE,
    )
    .reduce((acc, m) => acc + m.amount, 0);

  const closingAmount = session.openingAmount + entries - outputs;

  return prisma.cashSession.update({
    where: {
      id: session.id,
    },
    data: {
      isOpen: false,
      closedAt: new Date(),
      closingAmount,
    },
  });
};

export const getCurrentSession = async () => {
  return prisma.cashSession.findFirst({
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
};

export const addCashMovement = async (data: {
  type: CashMovementType;
  label: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
}) => {
  const session = await prisma.cashSession.findFirst({
    where: {
      isOpen: true,
    },
  });

  if (!session) {
    throw new Error("La caisse est fermée");
  }

  return prisma.cashMovement.create({
    data: {
      sessionId: session.id,
      type: data.type,
      label: data.label,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      note: data.note,
    },
  });
};

export const getCashHistory = async () => {
  return prisma.cashSession.findMany({
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
};
