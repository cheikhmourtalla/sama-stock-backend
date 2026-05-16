-- DropForeignKey
ALTER TABLE `stockmovement` DROP FOREIGN KEY `StockMovement_supplier_id_fkey`;

-- DropIndex
DROP INDEX `StockMovement_supplier_id_fkey` ON `stockmovement`;

-- AlterTable
ALTER TABLE `stockmovement` MODIFY `supplier_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
