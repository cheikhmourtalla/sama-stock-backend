/*
  Warnings:

  - You are about to drop the column `alertThreshold` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `sale` table. All the data in the column will be lost.
  - You are about to drop the `cashtransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cashtransaction` DROP FOREIGN KEY `CashTransaction_saleId_fkey`;

-- DropIndex
DROP INDEX `Product_reference_key` ON `product`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `alertThreshold`,
    DROP COLUMN `category`,
    DROP COLUMN `image`,
    DROP COLUMN `reference`;

-- AlterTable
ALTER TABLE `sale` DROP COLUMN `paymentMethod`;

-- DropTable
DROP TABLE `cashtransaction`;
