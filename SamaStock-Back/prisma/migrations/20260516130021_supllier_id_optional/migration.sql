/*
  Warnings:

  - You are about to drop the column `supplier_id` on the `product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_supplier_id_fkey`;

-- DropIndex
DROP INDEX `Product_supplier_id_fkey` ON `product`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `supplier_id`;
