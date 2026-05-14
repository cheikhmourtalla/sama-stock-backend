import { prisma } from "./../config/prisma";
// ALWAYS CHECK ID IF THE SOURCE ID EXTERNAL

export type ISupplier = {
  name: string;
  phone: string;
  address: string;
};
export const supplierService = {
  create: async (data: any) => {
    const res = await prisma.supplier.create({
      data,
    });
    return res;
  },

  findSuppliers: async () => {
    const res = await prisma.supplier.findMany();
    return res;
  },
  update: async (supplierData: ISupplier, supplierId: number) => {
    const res = await prisma.supplier.update({
      where: { id: supplierId },
      data: supplierData,
    });
    return res;
  },
  delete: async (supplierId: number) => {
    const res = await prisma.supplier.delete({
      where: { id: supplierId },
    });
    return res;
  },
};
