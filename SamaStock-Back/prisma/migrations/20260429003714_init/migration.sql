/*
  Warnings:

  - You are about to drop the `supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplierpayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supply` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `supplierpayment` DROP FOREIGN KEY `SupplierPayment_supplierId_fkey`;

-- DropForeignKey
ALTER TABLE `supply` DROP FOREIGN KEY `Supply_productId_fkey`;

-- DropForeignKey
ALTER TABLE `supply` DROP FOREIGN KEY `Supply_supplierId_fkey`;

-- AlterTable
ALTER TABLE `sale` ADD COLUMN `paymentMethod` ENUM('CASH', 'WAVE', 'BANK_TRANSFER') NOT NULL DEFAULT 'CASH';

-- DropTable
DROP TABLE `supplier`;

-- DropTable
DROP TABLE `supplierpayment`;

-- DropTable
DROP TABLE `supply`;

-- CreateTable
CREATE TABLE `CashTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('ENCASHMENT', 'DISBURSEMENT') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMethod` ENUM('CASH', 'WAVE', 'BANK_TRANSFER') NOT NULL,
    `cashbox` VARCHAR(191) NOT NULL DEFAULT 'Caisse Principale',
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `saleId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashTransaction` ADD CONSTRAINT `CashTransaction_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
